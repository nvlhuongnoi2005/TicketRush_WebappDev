from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from database import Base


class QueueEntry(Base):
    """Hàng chờ ảo (Virtual Queue) cho một sự kiện"""
    __tablename__ = "queue_entries"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    session_id = Column(String(100), nullable=False, index=True)  # UUID từ client
    position = Column(Integer, nullable=False)
    is_admitted = Column(Boolean, default=False)
    # Token cấp quyền truy cập màn hình chọn ghế
    access_token = Column(String(200), nullable=True)
    token_expires_at = Column(DateTime, nullable=True)
    joined_at = Column(DateTime, default=datetime.utcnow)
