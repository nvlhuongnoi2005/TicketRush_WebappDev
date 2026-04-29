from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from core.deps import get_current_user
from models.user import User
from models.seat import Seat, SeatStatus
from schemas.seat import LockSeatRequest, LockSeatResult
from services.seat_service import lock_seats, release_seat

router = APIRouter(prefix="/api/seats", tags=["Seats"])

MAX_SEATS_PER_USER = 5


@router.post("/lock", response_model=LockSeatResult)
def lock_multiple_seats(
    body: LockSeatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not body.seat_ids:
        raise HTTPException(status_code=400, detail="Danh sách ghế không được rỗng")

    now = datetime.utcnow()
    current_count = db.query(Seat).filter(
        Seat.locked_by == current_user.id,
        Seat.status == SeatStatus.locked,
        Seat.lock_expires_at > now,
    ).count()

    if current_count + len(body.seat_ids) > MAX_SEATS_PER_USER:
        raise HTTPException(
            status_code=400,
            detail=f"You can only hold up to {MAX_SEATS_PER_USER} seats at once.",
        )

    success, failed = lock_seats(db, body.seat_ids, current_user.id)

    expires_at = None
    if success:
        first_seat = db.query(Seat).filter(Seat.id == success[0]).first()
        expires_at = first_seat.lock_expires_at if first_seat else None

    return LockSeatResult(success=success, failed=failed, lock_expires_at=expires_at)


@router.delete("/lock/{seat_id}", status_code=204)
def unlock_seat(
    seat_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    seat = db.query(Seat).filter(Seat.id == seat_id).first()
    if not seat:
        raise HTTPException(status_code=404, detail="Ghế không tồn tại")
    if seat.locked_by != current_user.id:
        raise HTTPException(status_code=403, detail="Ghế này không thuộc về bạn")
    release_seat(db, seat_id, current_user.id)
