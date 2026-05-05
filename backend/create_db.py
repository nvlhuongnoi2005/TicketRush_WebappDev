"""
Script khởi tạo database TicketRush — tạo bảng, seed tài khoản và sự kiện demo.

Chạy một lần trước khi khởi động server lần đầu (hoặc sau khi reset DB):
    python create_db.py

Nếu database đã tồn tại, script chỉ thêm dữ liệu còn thiếu mà không xóa dữ liệu cũ.
"""
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime


def seed_demo_events() -> None:
    from database import SessionLocal
    from models.event import Event, EventStatus, SeatSection
    from models.seat import Seat

    db = SessionLocal()
    try:
        if db.query(Event).count() > 0:
            print("[Seed] Sự kiện đã tồn tại — bỏ qua bước tạo sự kiện demo.")
            return

        events_data = [
            {
                "title": "BLACKPINK World Tour",
                "artist": "BLACKPINK",
                "venue_name": "Sân vận động Mỹ Đình",
                "venue_address": "Hà Nội, Việt Nam",
                "event_date": datetime(2026, 6, 15, 19, 0),
                "status": EventStatus.on_sale,
                "banner_url": (
                    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                "description": (
                    "Đêm nhạc hoành tráng với màn trình diễn ánh sáng và "
                    "năng lượng từ một trong những nhóm nhạc lớn nhất thế giới."
                ),
                "queue_enabled": True,
                "sections": [
                    {"name": "VIP", "rows": 5, "cols": 20, "price": 2_000_000, "color": "#E94560"},
                    {"name": "A",   "rows": 10, "cols": 25, "price": 1_200_000, "color": "#4CAF50"},
                    {"name": "B",   "rows": 12, "cols": 30, "price": 800_000,   "color": "#2196F3"},
                ],
            },
            {
                "title": "Summer Festival 2026",
                "artist": "Various Artists",
                "venue_name": "Công viên sáng tạo TP.HCM",
                "venue_address": "TP. Hồ Chí Minh, Việt Nam",
                "event_date": datetime(2026, 7, 20, 17, 30),
                "status": EventStatus.on_sale,
                "banner_url": (
                    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                "description": (
                    "Festival ngoài trời cả ngày với ban nhạc sống, "
                    "khu ẩm thực và các hoạt động tương tác."
                ),
                "queue_enabled": False,
                "sections": [
                    {"name": "Front Stage", "rows": 4,  "cols": 18, "price": 1_500_000, "color": "#FF9800"},
                    {"name": "GA",          "rows": 12, "cols": 25, "price": 500_000,   "color": "#8BC34A"},
                ],
            },
            {
                "title": "Tech Conference 2026",
                "artist": "TicketRush Labs",
                "venue_name": "Trung tâm hội nghị Đà Nẵng",
                "venue_address": "Đà Nẵng, Việt Nam",
                "event_date": datetime(2026, 8, 12, 9, 0),
                "status": EventStatus.on_sale,
                "banner_url": (
                    "https://images.unsplash.com/photo-1511578314322-379afb476865"
                    "?auto=format&fit=crop&w=1200&q=80"
                ),
                "description": (
                    "Hội thảo 2 ngày dành cho developer, designer và product team "
                    "khám phá các quy trình bán vé hiện đại."
                ),
                "queue_enabled": False,
                "sections": [
                    {"name": "Hall A", "rows": 8,  "cols": 20, "price": 1_200_000, "color": "#9C27B0"},
                    {"name": "Hall B", "rows": 10, "cols": 15, "price": 300_000,   "color": "#03A9F4"},
                ],
            },
        ]

        total_seats = 0
        for ev_data in events_data:
            sections_data = ev_data.pop("sections")
            event = Event(**ev_data)
            db.add(event)
            db.flush()

            for sec_data in sections_data:
                section = SeatSection(event_id=event.id, **sec_data)
                db.add(section)
                db.flush()

                for row in range(1, section.rows + 1):
                    row_letter = chr(64 + row)  # A, B, C …
                    for col in range(1, section.cols + 1):
                        label = f"{section.name}-{row_letter}{str(col).zfill(2)}"
                        db.add(Seat(
                            section_id=section.id,
                            row_num=row,
                            col_num=col,
                            label=label,
                        ))
                        total_seats += 1

        db.commit()
        total_events = db.query(Event).count()
        print(f"[Seed] Đã tạo {total_events} sự kiện với tổng {total_seats} ghế.")
    finally:
        db.close()


if __name__ == "__main__":
    from database import init_db
    from main import _seed_admin

    print("=" * 55)
    print("  TicketRush — Khởi tạo database")
    print("=" * 55)

    print("\n[1/3] Tạo bảng và chạy migration...")
    init_db()
    print("      OK")

    print("[2/3] Seed tài khoản mặc định...")
    _seed_admin()
    print("      OK")

    print("[3/3] Seed sự kiện demo...")
    seed_demo_events()
    print("      OK")

    print("\nHoàn tất! Khởi động server với:  uvicorn main:app --reload")
    print("Swagger docs:                     http://localhost:8000/docs\n")
