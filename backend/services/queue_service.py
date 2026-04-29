"""
Virtual Queue Service.

Luồng:
1. Client gửi POST /api/queue/{event_id}/join với session_id (UUID)
2. Server tạo QueueEntry với position tăng dần
3. Client poll GET /api/queue/{event_id}/status?session_id=...
4. Background job (admit_batch) chạy mỗi N giây, cấp access_token cho nhóm tiếp theo
5. Khi is_admitted=True, frontend dùng access_token để vào màn hình chọn ghế
"""
import secrets
from datetime import datetime, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from core.config import settings
from models.queue import QueueEntry


def join_queue(db: Session, event_id: int, session_id: str, user_id=None) -> QueueEntry:
    existing = db.query(QueueEntry).filter(
        QueueEntry.event_id == event_id,
        QueueEntry.session_id == session_id,
    ).first()

    if existing:
        # Token đã hết hạn → đưa về cuối hàng chờ
        now = datetime.utcnow()
        if existing.is_admitted and existing.token_expires_at and existing.token_expires_at <= now:
            max_pos = db.query(func.max(QueueEntry.position)).filter(
                QueueEntry.event_id == event_id,
            ).scalar() or 0
            existing.position = max_pos + 1
            existing.is_admitted = False
            existing.access_token = None
            existing.token_expires_at = None
            db.commit()
        return existing

    max_pos = db.query(func.max(QueueEntry.position)).filter(
        QueueEntry.event_id == event_id,
    ).scalar() or 0

    entry = QueueEntry(
        event_id=event_id,
        session_id=session_id,
        user_id=user_id,
        position=max_pos + 1,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def get_queue_status(db: Session, event_id: int, session_id: str) -> dict:
    entry = db.query(QueueEntry).filter(
        QueueEntry.event_id == event_id,
        QueueEntry.session_id == session_id,
    ).first()
    if not entry:
        return None

    # Total unadmitted in queue
    total = db.query(func.count(QueueEntry.id)).filter(
        QueueEntry.event_id == event_id,
        QueueEntry.is_admitted == False,  # noqa: E712
    ).scalar()

    # Relative position = number of unadmitted users with a lower position + 1
    ahead = db.query(func.count(QueueEntry.id)).filter(
        QueueEntry.event_id == event_id,
        QueueEntry.is_admitted == False,  # noqa: E712
        QueueEntry.position < entry.position,
    ).scalar()
    relative_position = ahead + 1

    msg = (
        f"Bạn đang ở vị trí thứ {relative_position} trong hàng đợi. Vui lòng không tải lại trang..."
        if not entry.is_admitted
        else "Bạn đã được vào! Hãy tiến hành chọn ghế."
    )

    return {
        "session_id": session_id,
        "position": relative_position,
        "total_in_queue": total,
        "is_admitted": entry.is_admitted,
        "access_token": entry.access_token if entry.is_admitted else None,
        "token_expires_at": entry.token_expires_at,
        "message": msg,
    }


def admit_next_batch(db: Session, event_id: int):
    """Cấp quyền cho batch tiếp theo (gọi bởi scheduler)."""
    batch_size = settings.QUEUE_BATCH_SIZE
    token_ttl = timedelta(minutes=20)

    pending = (
        db.query(QueueEntry)
        .filter(
            QueueEntry.event_id == event_id,
            QueueEntry.is_admitted == False,  # noqa: E712
        )
        .order_by(QueueEntry.position)
        .limit(batch_size)
        .all()
    )

    for entry in pending:
        entry.is_admitted = True
        entry.access_token = secrets.token_urlsafe(32)
        entry.token_expires_at = datetime.utcnow() + token_ttl

    db.commit()
    return len(pending)


def verify_queue_token(db: Session, event_id: int, token: str) -> bool:
    """Frontend dùng token này khi vào màn hình chọn ghế."""
    entry = db.query(QueueEntry).filter(
        QueueEntry.event_id == event_id,
        QueueEntry.access_token == token,
        QueueEntry.is_admitted == True,  # noqa: E712
        QueueEntry.token_expires_at > datetime.utcnow(),
    ).first()
    return entry is not None
