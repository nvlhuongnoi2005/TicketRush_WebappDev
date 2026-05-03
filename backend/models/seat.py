import enum
from datetime import datetime
from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class SeatStatus(str, enum.Enum):
    available = "available"
    locked = "locked"    # đang giữ chỗ, chờ thanh toán
    sold = "sold"        # đã thanh toán thành công


class Seat(Base):
    __tablename__ = "seats"

    id = Column(Integer, primary_key=True, index=True)
    section_id = Column(Integer, ForeignKey("seat_sections.id"), nullable=False)
    row_num = Column(Integer, nullable=False)
    col_num = Column(Integer, nullable=False)
    label = Column(String(20))                  # "A-01", "VIP-B3"
    status = Column(SQLEnum(SeatStatus), default=SeatStatus.available, nullable=False)
    locked_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    locked_at = Column(DateTime, nullable=True)
    lock_expires_at = Column(DateTime, nullable=True)  # locked_at + 10 phút

    section = relationship("SeatSection", back_populates="seats")
