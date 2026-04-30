"""
Seed 3 sự kiện mẫu vào PostgreSQL cùng khu vực ghế và toàn bộ ghế ngồi.

Cách dùng:
    python seed_events.py

Yêu cầu: backend đang trỏ DATABASE_URL tới PostgreSQL và đã chạy init_db (schema tồn tại).
Chạy được nhiều lần – bỏ qua nếu sự kiện cùng tên đã tồn tại.
"""

import os
import sys

script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

from datetime import datetime
from database import SessionLocal, init_db
from models.event import Event, SeatSection, EventStatus
from models.seat import Seat, SeatStatus

init_db()

EVENTS = [
    {
        "title": "Sơn Tùng M-TP: Sky Tour 2025 – Live in Hà Nội",
        "description": (
            "Sky Tour trở lại với quy mô chưa từng có – đêm nhạc hoành tráng nhất năm 2025. "
            "Sơn Tùng M-TP sẽ trình diễn hơn 25 ca khúc hit cùng dàn vũ công, hiệu ứng ánh sáng và pháo hoa đặc biệt."
        ),
        "artist": "Sơn Tùng M-TP",
        "venue_name": "Sân vận động Mỹ Đình",
        "venue_address": "Đường Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
        "event_date": datetime(2025, 8, 15, 19, 30),
        "sale_start": datetime(2025, 6, 1, 10, 0),
        "sale_end": datetime(2025, 8, 15, 17, 0),
        "banner_url": "https://picsum.photos/seed/skytour/1200/400",
        "status": EventStatus.on_sale,
        "queue_enabled": True,
        "sections": [
            {"name": "SVIP – Sân khấu",  "rows": 5,  "cols": 20, "price": 3_500_000, "color": "#f59e0b"},
            {"name": "Khu A – Khán đài", "rows": 10, "cols": 30, "price": 2_000_000, "color": "#6366f1"},
            {"name": "Khu B – Khán đài", "rows": 12, "cols": 40, "price": 1_200_000, "color": "#10b981"},
        ],
    },
    {
        "title": "MONO Live Concert: Ký Ức – TP.HCM",
        "description": (
            "MONO mang đến một đêm nhạc đầy cảm xúc với những tình khúc đã chạm đến triệu trái tim. "
            "Concert quy mô vừa, mang lại trải nghiệm thân mật và gần gũi giữa nghệ sĩ và khán giả."
        ),
        "artist": "MONO",
        "venue_name": "Nhà hát TP.HCM – Trung tâm Hội nghị",
        "venue_address": "7 Công Trường Lam Sơn, Bến Nghé, Quận 1, TP.HCM",
        "event_date": datetime(2025, 9, 6, 20, 0),
        "sale_start": datetime(2025, 7, 1, 9, 0),
        "sale_end": datetime(2025, 9, 6, 18, 0),
        "banner_url": "https://picsum.photos/seed/monolive/1200/400",
        "status": EventStatus.on_sale,
        "queue_enabled": False,
        "sections": [
            {"name": "VIP – Hàng đầu",    "rows": 4,  "cols": 15, "price": 2_800_000, "color": "#f59e0b"},
            {"name": "Thường – Tầng 1",   "rows": 8,  "cols": 25, "price": 1_500_000, "color": "#3b82f6"},
            {"name": "Thường – Tầng 2",   "rows": 6,  "cols": 30, "price": 800_000,   "color": "#8b5cf6"},
        ],
    },
    {
        "title": "Rap Việt Season 4: Grand Final",
        "description": (
            "Đêm chung kết hoành tráng của Rap Việt mùa 4 – nơi những rapper xuất sắc nhất tranh tài "
            "cùng màn trình diễn bùng nổ của các huấn luyện viên và khách mời đặc biệt."
        ),
        "artist": "Various Artists – Rap Việt S4",
        "venue_name": "Trung tâm Hội chợ & Triển lãm Sài Gòn (SECC)",
        "venue_address": "799 Nguyễn Văn Linh, Tân Phú, Quận 7, TP.HCM",
        "event_date": datetime(2025, 10, 18, 18, 0),
        "sale_start": datetime(2025, 8, 15, 10, 0),
        "sale_end": datetime(2025, 10, 18, 16, 0),
        "banner_url": "https://picsum.photos/seed/rapviet4/1200/400",
        "status": EventStatus.on_sale,
        "queue_enabled": True,
        "sections": [
            {"name": "Diamond – Sân khấu", "rows": 3,  "cols": 20, "price": 4_000_000, "color": "#06b6d4"},
            {"name": "Gold – Giữa sân",    "rows": 8,  "cols": 35, "price": 2_200_000, "color": "#eab308"},
            {"name": "Silver – Khán đài",  "rows": 15, "cols": 50, "price": 900_000,   "color": "#94a3b8"},
        ],
    },
]


def make_label(section_name: str, row: int, col: int) -> str:
    prefix = section_name.split("–")[0].strip().split()[0][:3].upper()
    return f"{prefix}{row + 1}-{str(col + 1).zfill(2)}"


db = SessionLocal()
try:
    seeded = 0
    for ev_data in EVENTS:
        exists = db.query(Event).filter(Event.title == ev_data["title"]).first()
        if exists:
            print(f"  Bỏ qua (đã tồn tại): {ev_data['title']}")
            continue

        sections_data = ev_data.pop("sections")
        event = Event(**ev_data, created_by=1)
        db.add(event)
        db.flush()

        total_seats = 0
        for sec_data in sections_data:
            rows, cols = sec_data["rows"], sec_data["cols"]
            section = SeatSection(
                event_id=event.id,
                name=sec_data["name"],
                rows=rows,
                cols=cols,
                price=sec_data["price"],
                color=sec_data["color"],
            )
            db.add(section)
            db.flush()

            seats = [
                Seat(
                    section_id=section.id,
                    row_num=r,
                    col_num=c,
                    label=make_label(sec_data["name"], r, c),
                    status=SeatStatus.available,
                )
                for r in range(rows)
                for c in range(cols)
            ]
            db.bulk_save_objects(seats)
            total_seats += len(seats)

        db.commit()
        print(f"  Đã tạo: {ev_data['title']} – {total_seats} ghế")
        seeded += 1

    if seeded == 0:
        print("Không có sự kiện mới nào được tạo (tất cả đã tồn tại).")
    else:
        print(f"\nHoàn tất! Đã seed {seeded} sự kiện mới.")
finally:
    db.close()
