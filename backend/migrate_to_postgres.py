"""
Script migrate toàn bộ dữ liệu từ SQLite sang PostgreSQL.

Cách dùng:
    python migrate_to_postgres.py

Yêu cầu:
    - File ticketrush.db còn tồn tại (SQLite nguồn)
    - DATABASE_URL trong .env đã trỏ đến PostgreSQL
    - Database PostgreSQL đã được tạo sẵn (CREATE DATABASE ticketrush)
"""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

if not os.path.exists("ticketrush.db"):
    print("Lỗi: không tìm thấy ticketrush.db")
    sys.exit(1)

# ── Kết nối SQLite (nguồn) ────────────────────────────────────────────────────
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

sqlite_engine = create_engine("sqlite:///./ticketrush.db", connect_args={"check_same_thread": False})
SQLiteSession = sessionmaker(bind=sqlite_engine)

# ── Kết nối PostgreSQL (đích) ─────────────────────────────────────────────────
from core.config import settings
from database import engine as pg_engine, Base
from models import user, event, seat, order, ticket, queue  # noqa: F401 - register models
from models.user import User
from models.event import Event, SeatSection
from models.seat import Seat
from models.order import Order, OrderItem
from models.ticket import Ticket
from models.queue import QueueEntry

PGSession = sessionmaker(bind=pg_engine)

print(f"Nguồn  : sqlite:///./ticketrush.db")
print(f"Đích   : {settings.DATABASE_URL}")
print()

# ── Tạo schema PostgreSQL ─────────────────────────────────────────────────────
print("Tạo schema PostgreSQL...")
Base.metadata.create_all(bind=pg_engine)
print("Schema OK.")
print()

src = SQLiteSession()
dst = PGSession()

def migrate_table(model, label):
    rows = src.query(model).all()
    if not rows:
        print(f"  {label}: 0 bản ghi, bỏ qua.")
        return
    src.expunge_all()
    for row in rows:
        dst.merge(row)
    dst.commit()
    print(f"  {label}: {len(rows)} bản ghi ✓")

try:
    print("Đang migrate dữ liệu...")
    # Thứ tự đúng với foreign key dependencies
    migrate_table(User,        "users")
    migrate_table(Event,       "events")
    migrate_table(SeatSection, "seat_sections")
    migrate_table(Seat,        "seats")
    migrate_table(Order,       "orders")
    migrate_table(OrderItem,   "order_items")
    migrate_table(Ticket,      "tickets")
    migrate_table(QueueEntry,  "queue_entries")

    # Reset PostgreSQL sequences sau khi insert với explicit IDs
    print()
    print("Reset sequences...")
    tables_with_id = [
        "users", "events", "seat_sections", "seats",
        "orders", "order_items", "tickets", "queue_entries",
    ]
    with pg_engine.begin() as conn:
        for tbl in tables_with_id:
            conn.execute(text(
                f"SELECT setval(pg_get_serial_sequence('{tbl}', 'id'), "
                f"COALESCE(MAX(id), 0) + 1, false) FROM {tbl}"
            ))
    print("Sequences OK.")

except Exception as e:
    dst.rollback()
    print(f"\nLỗi: {e}")
    sys.exit(1)
finally:
    src.close()
    dst.close()

print()
print("Migration hoàn tất!")
