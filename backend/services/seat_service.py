"""
Seat locking service.

Concurrency strategy:
- SQLite (dev): sử dụng application-level mutex + immediate transaction
- PostgreSQL (prod): SELECT ... FOR UPDATE NOWAIT để database tự enforce row-level lock
  → Khi 2 request cùng lúc lock cùng ghế, chỉ 1 transaction thành công,
    transaction kia nhận OperationalError / LockNotAvailable và trả về "failed".
"""
import threading
from datetime import datetime, timedelta
from typing import List, Tuple

from sqlalchemy.orm import Session
from sqlalchemy import select
from sqlalchemy.exc import OperationalError

from core.config import settings
from models.seat import Seat, SeatStatus

# Application-level lock cho SQLite dev (không cần với PostgreSQL)
_sqlite_lock = threading.Lock()


def _is_postgres(db: Session) -> bool:
    return "postgresql" in str(db.get_bind().dialect.name)


def lock_seats(
    db: Session,
    seat_ids: List[int],
    user_id: int,
) -> Tuple[List[int], List[int]]:
    """
    Cố gắng lock tất cả seat_ids cho user.
    Trả về (success_ids, failed_ids).
    Mỗi ghế được xử lý trong transaction độc lập để tránh toàn bộ batch fail.
    """
    success, failed = [], []
    expires_at = datetime.utcnow() + timedelta(minutes=settings.SEAT_LOCK_MINUTES)

    for seat_id in seat_ids:
        try:
            if _is_postgres(db):
                _lock_seat_postgres(db, seat_id, user_id, expires_at)
            else:
                _lock_seat_sqlite(db, seat_id, user_id, expires_at)
            success.append(seat_id)
        except (ValueError, OperationalError):
            db.rollback()
            failed.append(seat_id)

    return success, failed


def _lock_seat_postgres(db: Session, seat_id: int, user_id: int, expires_at: datetime):
    """PostgreSQL: dùng SELECT FOR UPDATE NOWAIT – raise nếu row đang bị lock."""
    stmt = select(Seat).where(Seat.id == seat_id).with_for_update(nowait=True)
    seat = db.execute(stmt).scalar_one_or_none()
    _do_lock(db, seat, seat_id, user_id, expires_at)


def _lock_seat_sqlite(db: Session, seat_id: int, user_id: int, expires_at: datetime):
    """SQLite: application-level mutex đảm bảo chỉ 1 thread ghi tại 1 thời điểm."""
    with _sqlite_lock:
        seat = db.query(Seat).filter(Seat.id == seat_id).first()
        _do_lock(db, seat, seat_id, user_id, expires_at)


def _do_lock(db: Session, seat, seat_id: int, user_id: int, expires_at: datetime):
    if seat is None:
        raise ValueError(f"Seat {seat_id} không tồn tại")
    now = datetime.utcnow()
    is_expired_lock = (
        seat.status == SeatStatus.locked
        and seat.lock_expires_at is not None
        and seat.lock_expires_at <= now
    )
    if seat.status != SeatStatus.available and not is_expired_lock:
        raise ValueError(f"Seat {seat_id} không available")
    seat.status = SeatStatus.locked
    seat.locked_by = user_id
    seat.locked_at = datetime.utcnow()
    seat.lock_expires_at = expires_at
    db.commit()
    db.refresh(seat)


def release_seat(db: Session, seat_id: int, user_id: int):
    """Người dùng chủ động nhả ghế đang giữ."""
    seat = db.query(Seat).filter(
        Seat.id == seat_id,
        Seat.locked_by == user_id,
        Seat.status == SeatStatus.locked,
    ).first()
    if seat:
        _reset_seat(db, seat)


def release_expired_seats(db: Session) -> int:
    """Gọi bởi scheduler: nhả tất cả ghế đã hết hạn giữ chỗ."""
    now = datetime.utcnow()
    expired = db.query(Seat).filter(
        Seat.status == SeatStatus.locked,
        Seat.lock_expires_at <= now,
    ).all()
    for seat in expired:
        _reset_seat(db, seat)
    return len(expired)


def _reset_seat(db: Session, seat: Seat):
    seat.status = SeatStatus.available
    seat.locked_by = None
    seat.locked_at = None
    seat.lock_expires_at = None
    db.commit()
