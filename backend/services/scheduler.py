"""
Background scheduler sử dụng APScheduler.
Jobs:
  1. release_expired_seats   – chạy mỗi 60s
  2. cancel_expired_orders   – chạy mỗi 60s
  3. admit_queue_batches     – chạy mỗi QUEUE_ADMIT_INTERVAL_SECONDS
"""
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from core.config import settings
from database import SessionLocal
from services.seat_service import release_expired_seats
from services.order_service import cancel_expired_orders
from models.event import Event, EventStatus

scheduler = BackgroundScheduler(timezone="UTC")


def _job_release_seats():
    db = SessionLocal()
    try:
        n = release_expired_seats(db)
        if n:
            print(f"[Scheduler] Đã nhả {n} ghế hết hạn")
    finally:
        db.close()


def _job_cancel_orders():
    db = SessionLocal()
    try:
        n = cancel_expired_orders(db)
        if n:
            print(f"[Scheduler] Đã hủy {n} đơn hàng hết hạn")
    finally:
        db.close()


def _job_admit_queues():
    from services.queue_service import admit_next_batch
    db = SessionLocal()
    try:
        events = db.query(Event).filter(
            Event.status == EventStatus.on_sale,
            Event.queue_enabled == True,  # noqa: E712
        ).all()
        for event in events:
            n = admit_next_batch(db, event.id)
            if n:
                print(f"[Scheduler] Queue event {event.id}: cấp quyền cho {n} người")
    finally:
        db.close()


def start_scheduler():
    # Run cleanup immediately so expired seats/orders don't linger after restart
    _job_release_seats()
    _job_cancel_orders()

    scheduler.add_job(_job_release_seats, IntervalTrigger(seconds=60), id="release_seats", replace_existing=True)
    scheduler.add_job(_job_cancel_orders, IntervalTrigger(seconds=60), id="cancel_orders", replace_existing=True)
    scheduler.add_job(
        _job_admit_queues,
        IntervalTrigger(seconds=settings.QUEUE_ADMIT_INTERVAL_SECONDS),
        id="admit_queues",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Đã khởi động background jobs")


def stop_scheduler():
    scheduler.shutdown(wait=False)
