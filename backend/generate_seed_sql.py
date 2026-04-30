"""
Sinh file SQL đầy đủ: schema + dữ liệu mẫu 3 sự kiện.
Chạy:  python3 generate_seed_sql.py
Output: seed_events.sql
"""

from __future__ import annotations
from datetime import datetime

OUTPUT = "seed_events.sql"

EVENTS = [
    {
        "id": 1,
        "title": "Sơn Tùng M-TP: Sky Tour 2025 – Live in Hà Nội",
        "description": (
            "Sky Tour trở lại với quy mô chưa từng có – đêm nhạc hoành tráng nhất năm 2025. "
            "Sơn Tùng M-TP sẽ trình diễn hơn 25 ca khúc hit cùng dàn vũ công, "
            "hiệu ứng ánh sáng và pháo hoa đặc biệt."
        ),
        "artist": "Sơn Tùng M-TP",
        "venue_name": "Sân vận động Mỹ Đình",
        "venue_address": "Đường Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
        "event_date": "2025-08-15 19:30:00",
        "sale_start": "2025-06-01 10:00:00",
        "sale_end":   "2025-08-15 17:00:00",
        "banner_url": "https://picsum.photos/seed/skytour2025/1200/400",
        "status": "on_sale",
        "queue_enabled": True,
        "sections": [
            {"id": 1, "name": "SVIP – Sân khấu",  "rows": 5,  "cols": 20, "price": 3_500_000, "color": "#f59e0b"},
            {"id": 2, "name": "Khu A – Khán đài", "rows": 10, "cols": 30, "price": 2_000_000, "color": "#6366f1"},
            {"id": 3, "name": "Khu B – Khán đài", "rows": 12, "cols": 40, "price": 1_200_000, "color": "#10b981"},
        ],
    },
    {
        "id": 2,
        "title": "MONO Live Concert: Ký Ức – TP.HCM",
        "description": (
            "MONO mang đến một đêm nhạc đầy cảm xúc với những tình khúc đã chạm đến triệu trái tim. "
            "Concert quy mô vừa, mang lại trải nghiệm thân mật và gần gũi giữa nghệ sĩ và khán giả."
        ),
        "artist": "MONO",
        "venue_name": "Nhà hát TP.HCM – Trung tâm Hội nghị",
        "venue_address": "7 Công Trường Lam Sơn, Bến Nghé, Quận 1, TP.HCM",
        "event_date": "2025-09-06 20:00:00",
        "sale_start": "2025-07-01 09:00:00",
        "sale_end":   "2025-09-06 18:00:00",
        "banner_url": "https://picsum.photos/seed/monolive2025/1200/400",
        "status": "on_sale",
        "queue_enabled": False,
        "sections": [
            {"id": 4, "name": "VIP – Hàng đầu",  "rows": 4, "cols": 15, "price": 2_800_000, "color": "#f59e0b"},
            {"id": 5, "name": "Thường – Tầng 1", "rows": 8, "cols": 25, "price": 1_500_000, "color": "#3b82f6"},
            {"id": 6, "name": "Thường – Tầng 2", "rows": 6, "cols": 30, "price":   800_000, "color": "#8b5cf6"},
        ],
    },
    {
        "id": 3,
        "title": "Rap Việt Season 4: Grand Final",
        "description": (
            "Đêm chung kết hoành tráng của Rap Việt mùa 4 – nơi những rapper xuất sắc nhất tranh tài "
            "cùng màn trình diễn bùng nổ của các huấn luyện viên và khách mời đặc biệt."
        ),
        "artist": "Various Artists – Rap Việt S4",
        "venue_name": "Trung tâm Hội chợ & Triển lãm Sài Gòn (SECC)",
        "venue_address": "799 Nguyễn Văn Linh, Tân Phú, Quận 7, TP.HCM",
        "event_date": "2025-10-18 18:00:00",
        "sale_start": "2025-08-15 10:00:00",
        "sale_end":   "2025-10-18 16:00:00",
        "banner_url": "https://picsum.photos/seed/rapviet4/1200/400",
        "status": "on_sale",
        "queue_enabled": True,
        "sections": [
            {"id": 7, "name": "Diamond – Sân khấu", "rows":  3, "cols": 20, "price": 4_000_000, "color": "#06b6d4"},
            {"id": 8, "name": "Gold – Giữa sân",    "rows":  8, "cols": 35, "price": 2_200_000, "color": "#eab308"},
            {"id": 9, "name": "Silver – Khán đài",  "rows": 15, "cols": 50, "price":   900_000, "color": "#94a3b8"},
        ],
    },
]


def esc(s: str) -> str:
    return s.replace("'", "''")


def make_label(section_name: str, row: int, col: int) -> str:
    prefix = section_name.split("–")[0].strip().split()[0][:4].upper()
    return f"{prefix}{row + 1}-{str(col + 1).zfill(2)}"


lines: list[str] = []

# ─── Header ──────────────────────────────────────────────────────────────────
lines += [
    "-- ============================================================",
    "-- TicketRush – schema + dữ liệu mẫu 3 sự kiện",
    f"-- Sinh tự động lúc {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
    "-- ============================================================",
    "",
    "BEGIN;",
    "",
]

# ─── ENUM types ───────────────────────────────────────────────────────────────
lines += [
    "-- ── enum types ──────────────────────────────────────────────────────────",
    "DO $$ BEGIN",
    "  CREATE TYPE userrole    AS ENUM ('customer', 'admin');",
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "",
    "DO $$ BEGIN",
    "  CREATE TYPE eventstatus AS ENUM ('draft','on_sale','sold_out','finished','cancelled');",
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "",
    "DO $$ BEGIN",
    "  CREATE TYPE seatstatus  AS ENUM ('available','locked','sold');",
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "",
    "DO $$ BEGIN",
    "  CREATE TYPE orderstatus AS ENUM ('pending','paid','cancelled');",
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "",
    "DO $$ BEGIN",
    "  CREATE TYPE ticketstatus AS ENUM ('valid','used','cancelled');",
    "EXCEPTION WHEN duplicate_object THEN NULL; END $$;",
    "",
]

# ─── CREATE TABLE ─────────────────────────────────────────────────────────────
lines += [
    "-- ── tables ──────────────────────────────────────────────────────────────",
    """CREATE TABLE IF NOT EXISTS users (
    id                      SERIAL PRIMARY KEY,
    full_name               VARCHAR(100) NOT NULL,
    email                   VARCHAR(100) UNIQUE NOT NULL,
    phone                   VARCHAR(20),
    dob                     VARCHAR(10),
    gender                  VARCHAR(10),
    username                VARCHAR(50) UNIQUE NOT NULL,
    hashed_password         VARCHAR(255) NOT NULL,
    role                    userrole NOT NULL DEFAULT 'customer',
    is_active               BOOLEAN DEFAULT TRUE,
    created_at              TIMESTAMP DEFAULT NOW(),
    reset_token             VARCHAR(100),
    reset_token_expires_at  TIMESTAMP,
    payment_cooldown_until  TIMESTAMP
);""",
    "",
    """CREATE TABLE IF NOT EXISTS events (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(200) NOT NULL,
    description   TEXT,
    artist        VARCHAR(200),
    venue_name    VARCHAR(200) NOT NULL,
    venue_address VARCHAR(500),
    event_date    TIMESTAMP NOT NULL,
    sale_start    TIMESTAMP,
    sale_end      TIMESTAMP,
    banner_url    VARCHAR(500),
    status        eventstatus NOT NULL DEFAULT 'draft',
    queue_enabled BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT NOW(),
    created_by    INTEGER REFERENCES users(id)
);""",
    "",
    """CREATE TABLE IF NOT EXISTS seat_sections (
    id       SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name     VARCHAR(50) NOT NULL,
    rows     INTEGER NOT NULL,
    cols     INTEGER NOT NULL,
    price    FLOAT NOT NULL,
    color    VARCHAR(20) DEFAULT '#4CAF50'
);""",
    "",
    """CREATE TABLE IF NOT EXISTS seats (
    id              SERIAL PRIMARY KEY,
    section_id      INTEGER NOT NULL REFERENCES seat_sections(id) ON DELETE CASCADE,
    row_num         INTEGER NOT NULL,
    col_num         INTEGER NOT NULL,
    label           VARCHAR(20),
    status          seatstatus NOT NULL DEFAULT 'available',
    locked_by       INTEGER REFERENCES users(id),
    locked_at       TIMESTAMP,
    lock_expires_at TIMESTAMP
);""",
    "",
    """CREATE TABLE IF NOT EXISTS orders (
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    total_amount FLOAT DEFAULT 0,
    status       orderstatus NOT NULL DEFAULT 'pending',
    created_at   TIMESTAMP DEFAULT NOW(),
    expires_at   TIMESTAMP,
    paid_at      TIMESTAMP
);""",
    "",
    """CREATE TABLE IF NOT EXISTS order_items (
    id       SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    seat_id  INTEGER NOT NULL REFERENCES seats(id),
    price    FLOAT NOT NULL
);""",
    "",
    """CREATE TABLE IF NOT EXISTS tickets (
    id            SERIAL PRIMARY KEY,
    order_id      INTEGER NOT NULL REFERENCES orders(id),
    seat_id       INTEGER NOT NULL REFERENCES seats(id),
    event_id      INTEGER NOT NULL REFERENCES events(id),
    user_id       INTEGER NOT NULL REFERENCES users(id),
    qr_data       VARCHAR(200),
    qr_image_url  TEXT,
    status        ticketstatus NOT NULL DEFAULT 'valid',
    price         FLOAT NOT NULL,
    issued_at     TIMESTAMP DEFAULT NOW()
);""",
    "",
    """CREATE TABLE IF NOT EXISTS queue_entries (
    id               SERIAL PRIMARY KEY,
    event_id         INTEGER NOT NULL REFERENCES events(id),
    user_id          INTEGER REFERENCES users(id),
    session_id       VARCHAR(100) NOT NULL,
    position         INTEGER NOT NULL,
    is_admitted      BOOLEAN DEFAULT FALSE,
    access_token     VARCHAR(200),
    token_expires_at TIMESTAMP,
    joined_at        TIMESTAMP DEFAULT NOW()
);""",
    "",
    "CREATE INDEX IF NOT EXISTS ix_queue_entries_session_id ON queue_entries(session_id);",
    "CREATE INDEX IF NOT EXISTS ix_users_email              ON users(email);",
    "CREATE INDEX IF NOT EXISTS ix_users_username           ON users(username);",
    "CREATE INDEX IF NOT EXISTS ix_events_id                ON events(id);",
    "CREATE INDEX IF NOT EXISTS ix_seats_id                 ON seats(id);",
    "",
]

# ─── Seed user admin (created_by = 1) ─────────────────────────────────────────
lines += [
    "-- ── seed: admin user (created_by FK) ───────────────────────────────────",
    "INSERT INTO users (id, full_name, email, username, hashed_password, role)",
    "VALUES (1, 'Admin TicketRush', 'admin@ticketrush.vn', 'admin',",
    "        '$2b$12$placeholderhashforseeddataonly000000000000000000000000', 'admin')",
    "ON CONFLICT (id) DO NOTHING;",
    "",
]

# ─── events ───────────────────────────────────────────────────────────────────
lines += [
    "-- ── events ──────────────────────────────────────────────────────────────",
    "INSERT INTO events (id, title, description, artist, venue_name, venue_address,",
    "                    event_date, sale_start, sale_end, banner_url,",
    "                    status, queue_enabled, created_at, created_by)",
    "VALUES",
]
event_rows = []
for ev in EVENTS:
    q = "TRUE" if ev["queue_enabled"] else "FALSE"
    event_rows.append(
        f"  ({ev['id']},\n"
        f"   '{esc(ev['title'])}',\n"
        f"   '{esc(ev['description'])}',\n"
        f"   '{esc(ev['artist'])}', '{esc(ev['venue_name'])}', '{esc(ev['venue_address'])}',\n"
        f"   '{ev['event_date']}', '{ev['sale_start']}', '{ev['sale_end']}',\n"
        f"   '{ev['banner_url']}',\n"
        f"   '{ev['status']}', {q}, NOW(), 1)"
    )
lines.append(",\n".join(event_rows) + "\nON CONFLICT (id) DO NOTHING;")
lines.append("")

# ─── seat_sections ────────────────────────────────────────────────────────────
lines += [
    "-- ── seat_sections ───────────────────────────────────────────────────────",
    "INSERT INTO seat_sections (id, event_id, name, rows, cols, price, color)",
    "VALUES",
]
sec_rows = []
for ev in EVENTS:
    for sec in ev["sections"]:
        sec_rows.append(
            f"  ({sec['id']}, {ev['id']}, '{esc(sec['name'])}',\n"
            f"   {sec['rows']}, {sec['cols']}, {sec['price']}, '{sec['color']}')"
        )
lines.append(",\n".join(sec_rows) + "\nON CONFLICT (id) DO NOTHING;")
lines.append("")

# ─── seats (batch 500) ────────────────────────────────────────────────────────
lines.append("-- ── seats ───────────────────────────────────────────────────────────────")

seat_rows = []
total_seats = 0
for ev in EVENTS:
    for sec in ev["sections"]:
        for r in range(sec["rows"]):
            for c in range(sec["cols"]):
                label = make_label(sec["name"], r, c)
                seat_rows.append(f"  ({sec['id']}, {r}, {c}, '{label}', 'available')")
                total_seats += 1

BATCH = 500
for i in range(0, len(seat_rows), BATCH):
    chunk = seat_rows[i:i + BATCH]
    lines.append(
        "INSERT INTO seats (section_id, row_num, col_num, label, status) VALUES\n"
        + ",\n".join(chunk) + ";"
    )
lines.append("")

# ─── Reset sequences ──────────────────────────────────────────────────────────
max_ev  = max(ev["id"] for ev in EVENTS)
max_sec = max(sec["id"] for ev in EVENTS for sec in ev["sections"])

lines += [
    "-- ── reset sequences ─────────────────────────────────────────────────────",
    f"SELECT setval(pg_get_serial_sequence('users',        'id'), GREATEST((SELECT MAX(id) FROM users), 1));",
    f"SELECT setval(pg_get_serial_sequence('events',       'id'), {max_ev});",
    f"SELECT setval(pg_get_serial_sequence('seat_sections','id'), {max_sec});",
    "SELECT setval(pg_get_serial_sequence('seats',         'id'), (SELECT MAX(id) FROM seats));",
    "",
    "COMMIT;",
    "",
    f"-- Tổng: {len(EVENTS)} sự kiện · {sum(len(e['sections']) for e in EVENTS)} khu · {total_seats:,} ghế",
]

sql_text = "\n".join(lines)

with open(OUTPUT, "w", encoding="utf-8") as f:
    f.write(sql_text)

print(f"Đã ghi {OUTPUT}")
print(f"  Sự kiện : {len(EVENTS)}")
print(f"  Khu vực : {sum(len(e['sections']) for e in EVENTS)}")
print(f"  Tổng ghế: {total_seats:,}")
