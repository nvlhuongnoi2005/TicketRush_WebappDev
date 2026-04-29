from typing import List
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from core.config import settings

from database import get_db
from core.deps import get_current_user
from models.user import User
from models.order import Order, OrderStatus
from schemas.order import OrderCreate, OrderOut, OrderItemOut
from services.order_service import create_order, confirm_order

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def _build_order_out(order: Order) -> OrderOut:
    items_out = []
    for item in order.items:
        seat = item.seat
        section = seat.section if seat else None
        items_out.append(OrderItemOut(
            id=item.id,
            seat_id=item.seat_id,
            seat_label=seat.label if seat else None,
            section_name=section.name if section else None,
            price=item.price,
        ))
    return OrderOut(
        id=order.id,
        user_id=order.user_id,
        total_amount=order.total_amount,
        status=order.status,
        created_at=order.created_at,
        expires_at=order.expires_at,
        paid_at=order.paid_at,
        items=items_out,
    )


@router.post("", response_model=OrderOut, status_code=201)
def create_new_order(
    body: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        order = create_order(db, current_user.id, body.seat_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _build_order_out(order)


@router.get("", response_model=List[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    orders = (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [_build_order_out(o) for o in orders]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")
    return _build_order_out(order)


@router.get("/{order_id}/payment-qr")
def get_payment_qr(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Trả về VietQR URL để thanh toán chuyển khoản ngân hàng."""
    order = db.query(Order).filter(
        Order.id == order_id,
        Order.user_id == current_user.id,
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Đơn hàng không tồn tại")

    description = quote(f"TICKETRUSH ORDER {order_id}")
    acc_name = quote(settings.BANK_ACCOUNT_NAME)
    qr_url = (
        f"https://img.vietqr.io/image/{settings.BANK_ID}-{settings.BANK_ACCOUNT}-qr_only.png"
        f"?amount={int(order.total_amount)}&addInfo={description}&accountName={acc_name}"
    )
    return {
        "qr_url": qr_url,
        "bank_id": settings.BANK_ID,
        "account_no": settings.BANK_ACCOUNT,
        "account_name": settings.BANK_ACCOUNT_NAME,
        "amount": order.total_amount,
        "description": f"TICKETRUSH ORDER {order_id}",
    }


@router.post("/{order_id}/confirm", response_model=OrderOut)
def confirm_payment(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Giả lập thanh toán – bấm XÁC NHẬN là coi như thanh toán thành công."""
    try:
        confirm_order(db, order_id, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    order = db.query(Order).filter(Order.id == order_id).first()
    return _build_order_out(order)
