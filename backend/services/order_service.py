from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

from core.config import settings
from models.order import Order, OrderItem, OrderStatus
from models.seat import Seat, SeatStatus
from models.ticket import Ticket
from services.qr_service import generate_qr_data, generate_qr_base64


def create_order(db: Session, user_id: int, seat_ids: List[int]) -> Order:
    """
    Tạo đơn hàng từ các ghế đang locked bởi user.
    Idempotent: nếu user đã có pending order chứa đúng các ghế này, trả về order cũ.
    Raise ValueError nếu ghế không hợp lệ.
    """
    seat_set = set(seat_ids)

    # Return existing pending order if it covers exactly the same seats
    existing = (
        db.query(Order)
        .filter(Order.user_id == user_id, Order.status == OrderStatus.pending)
        .order_by(Order.id.desc())
        .first()
    )
    if existing:
        existing_seat_ids = {item.seat_id for item in existing.items}
        if existing_seat_ids == seat_set:
            return existing

    expires_at = datetime.utcnow() + timedelta(minutes=settings.SEAT_LOCK_MINUTES)
    total = 0.0
    items = []

    for seat_id in seat_ids:
        seat = db.query(Seat).filter(
            Seat.id == seat_id,
            Seat.locked_by == user_id,
            Seat.status == SeatStatus.locked,
        ).first()
        if not seat:
            raise ValueError(f"Ghế {seat_id} không thuộc về bạn hoặc chưa được giữ")
        price = seat.section.price
        total += price
        items.append(OrderItem(seat_id=seat_id, price=price))

    order = Order(
        user_id=user_id,
        total_amount=total,
        status=OrderStatus.pending,
        expires_at=expires_at,
    )
    order.items = items
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def confirm_order(db: Session, order_id: int, user_id: int) -> List[Ticket]:
    """
    Người dùng xác nhận thanh toán → ghế → sold, tạo vé + QR.
    """
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == user_id,
        Order.status == OrderStatus.pending,
    ).first()
    if not order:
        raise ValueError("Đơn hàng không tồn tại hoặc không thuộc về bạn")
    if order.expires_at and datetime.utcnow() > order.expires_at:
        raise ValueError("Đơn hàng đã hết hạn. Vui lòng chọn ghế lại")

    tickets = []
    for item in order.items:
        seat = db.query(Seat).filter(Seat.id == item.seat_id).first()
        if not seat or seat.status != SeatStatus.locked:
            raise ValueError(f"Ghế {item.seat_id} không còn khả dụng")

        seat.status = SeatStatus.sold
        seat.locked_by = None
        seat.locked_at = None
        seat.lock_expires_at = None

        qr_data = generate_qr_data(ticket_id=0, user_id=user_id)  # placeholder
        ticket = Ticket(
            order_id=order.id,
            seat_id=seat.id,
            event_id=seat.section.event_id,
            user_id=user_id,
            price=item.price,
            qr_data=qr_data,
        )
        db.add(ticket)
        db.flush()  # get ticket.id

        # Cập nhật QR với ticket_id thực
        real_qr_data = generate_qr_data(ticket.id, user_id)
        ticket.qr_data = real_qr_data
        ticket.qr_image_url = generate_qr_base64(real_qr_data)
        tickets.append(ticket)

    order.status = OrderStatus.paid
    order.paid_at = datetime.utcnow()
    db.commit()
    return tickets


def cancel_expired_orders(db: Session) -> int:
    """Gọi bởi scheduler: hủy đơn pending đã quá 10 phút."""
    now = datetime.utcnow()
    expired_orders = db.query(Order).filter(
        Order.status == OrderStatus.pending,
        Order.expires_at <= now,
    ).all()

    count = 0
    for order in expired_orders:
        order.status = OrderStatus.cancelled
        count += 1

    db.commit()
    return count
