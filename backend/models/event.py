import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from database import Base


class EventStatus(str, enum.Enum):
    draft = "draft"
    on_sale = "on_sale"
    sold_out = "sold_out"
    finished = "finished"
    cancelled = "cancelled"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    artist = Column(String(200))
    venue_name = Column(String(200), nullable=False)
    venue_address = Column(String(500))
    event_date = Column(DateTime, nullable=False)
    sale_start = Column(DateTime)
    sale_end = Column(DateTime)
    banner_url = Column(String(500))
    status = Column(SQLEnum(EventStatus), default=EventStatus.draft, nullable=False)
    queue_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

    sections = relationship("SeatSection", back_populates="event", cascade="all, delete-orphan")


class SeatSection(Base):
    """Khu vực ghế ngồi trong một sự kiện (VD: Khu A, VIP, SVIP...)"""
    __tablename__ = "seat_sections"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    name = Column(String(50), nullable=False)    # "Khu A", "VIP"
    rows = Column(Integer, nullable=False)
    cols = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    color = Column(String(20), default="#4CAF50")  # hex color for frontend display

    event = relationship("Event", back_populates="sections")
    seats = relationship("Seat", back_populates="section", cascade="all, delete-orphan")
