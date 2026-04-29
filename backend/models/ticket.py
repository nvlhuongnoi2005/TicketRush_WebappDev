import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class TicketStatus(str, enum.Enum):
    valid = "valid"
    used = "used"
    cancelled = "cancelled"


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    seat_id = Column(Integer, ForeignKey("seats.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    qr_data = Column(String(200))     # dữ liệu encode vào QR (ticket_id + secret)
    qr_image_url = Column(String(500))  # đường dẫn ảnh QR đã tạo
    status = Column(SQLEnum(TicketStatus), default=TicketStatus.valid)
    price = Column(Float, nullable=False)
    issued_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order", back_populates="tickets")
    seat = relationship("Seat")
    event = relationship("Event")
