from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.deps import get_optional_user
from models.event import Event
from schemas.queue import QueueJoinRequest, QueueStatusOut
from services.queue_service import join_queue, get_queue_status, verify_queue_token, admit_next_batch

router = APIRouter(prefix="/api/queue", tags=["Virtual Queue"])


@router.post("/{event_id}/join", response_model=QueueStatusOut)
def join_event_queue(
    event_id: int,
    body: QueueJoinRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_optional_user),
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Sự kiện không tồn tại")
    if not event.queue_enabled:
        raise HTTPException(status_code=400, detail="Sự kiện này không bật hàng chờ ảo")

    user_id = current_user.id if current_user else None
    entry = join_queue(db, event_id, body.session_id, user_id)

    # Admit immediately if the user is already at the front and not yet admitted
    if not entry.is_admitted:
        admit_next_batch(db, event_id)

    status = get_queue_status(db, event_id, body.session_id)
    return QueueStatusOut(**status)


@router.get("/{event_id}/status", response_model=QueueStatusOut)
def poll_queue_status(
    event_id: int,
    session_id: str,
    db: Session = Depends(get_db),
):
    status = get_queue_status(db, event_id, session_id)
    if not status:
        raise HTTPException(status_code=404, detail="Không tìm thấy trong hàng chờ")

    # Try to admit the next batch on every poll so position-1 users are never stuck
    if not status["is_admitted"]:
        admit_next_batch(db, event_id)
        status = get_queue_status(db, event_id, session_id)

    return QueueStatusOut(**status)


@router.post("/{event_id}/verify-token")
def verify_access_token(
    event_id: int,
    token: str,
    db: Session = Depends(get_db),
):
    """Frontend gọi trước khi cho phép vào màn hình chọn ghế."""
    valid = verify_queue_token(db, event_id, token)
    if not valid:
        raise HTTPException(status_code=403, detail="Token không hợp lệ hoặc đã hết hạn")
    return {"valid": True}
