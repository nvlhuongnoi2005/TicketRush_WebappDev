from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20,
    pool_recycle=1800,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from models import user, event, seat, order, ticket, queue  # noqa: F401
    Base.metadata.create_all(bind=engine)
    _run_migrations()


def _run_migrations():
    """Thêm các cột mới và index vào bảng hiện có mà không mất dữ liệu."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_cooldown_until TIMESTAMP",
        # Indexes for hot-path columns
        "CREATE INDEX IF NOT EXISTS ix_seats_status ON seats (status)",
        "CREATE INDEX IF NOT EXISTS ix_seats_locked_by ON seats (locked_by)",
        "CREATE INDEX IF NOT EXISTS ix_seats_lock_expires_at ON seats (lock_expires_at)",
        "CREATE INDEX IF NOT EXISTS ix_orders_user_id ON orders (user_id)",
        "CREATE INDEX IF NOT EXISTS ix_orders_status ON orders (status)",
        "CREATE INDEX IF NOT EXISTS ix_orders_expires_at ON orders (expires_at)",
        "CREATE INDEX IF NOT EXISTS ix_orders_paid_at ON orders (paid_at)",
        "CREATE INDEX IF NOT EXISTS ix_tickets_event_id ON tickets (event_id)",
        "CREATE INDEX IF NOT EXISTS ix_tickets_user_id ON tickets (user_id)",
        "CREATE INDEX IF NOT EXISTS ix_tickets_issued_at ON tickets (issued_at)",
        "CREATE INDEX IF NOT EXISTS ix_queue_entries_event_id ON queue_entries (event_id)",
        "CREATE INDEX IF NOT EXISTS ix_queue_entries_position ON queue_entries (position)",
        "CREATE INDEX IF NOT EXISTS ix_queue_entries_is_admitted ON queue_entries (is_admitted)",
    ]
    with engine.begin() as conn:
        for stmt in migrations:
            try:
                conn.execute(text(stmt))
            except Exception:
                pass
