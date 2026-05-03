import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer
from sqlalchemy.orm import relationship
from database import Base


class OrderStatus(str, enum.Enum):
    pending = "pending"        # đang chờ thanh toán (ghế đang locked)
    paid = "paid"              # đã xác nhận thanh toán
    cancelled = "cancelled"    # hủy hoặc hết hạn


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, default=0)
    status = Column(SQLEnum(OrderStatus), default=OrderStatus.pending, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)   # created_at + 10 phút
    paid_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="order")


class OrderItem(Base):
    """Dòng chi tiết đơn hàng - mỗi dòng ứng với 1 ghế"""
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    price = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    seat = relationship("Seat")
