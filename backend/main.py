from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from database import init_db
from core.config import settings
from routers import auth, events, seats, orders, tickets, admin, queue, ws
from services.scheduler import start_scheduler, stop_scheduler

app = FastAPI(
    title="TicketRush API",
    description="Backend hệ thống bán vé sự kiện âm nhạc / giải trí",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (QR images)
os.makedirs("static/qr", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Routers
app.include_router(auth.router)
app.include_router(events.router)
app.include_router(seats.router)
app.include_router(orders.router)
app.include_router(tickets.router)
app.include_router(admin.router)
app.include_router(queue.router)
app.include_router(ws.router)


@app.on_event("startup")
def startup():
    init_db()
    start_scheduler()
    _seed_admin()
    print("TicketRush API khởi động thành công!")


@app.on_event("shutdown")
def shutdown():
    stop_scheduler()


def _seed_admin():
    """Tạo tài khoản mặc định nếu chưa có."""
    from database import SessionLocal
    from models.user import User, UserRole
    from core.security import hash_password
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                full_name="Admin TicketRush",
                email="admin@ticketrush.vn",
                username="admin",
                hashed_password=hash_password("Admin@123"),
                role=UserRole.admin,
            ))
            db.commit()
            print("[Seed] Đã tạo tài khoản admin: username=admin, password=Admin@123")
        if not db.query(User).filter(User.username == "tester").first():
            db.add(User(
                full_name="Tester User",
                email="tester@ticketrush.vn",
                username="tester",
                hashed_password=hash_password("123"),
                role=UserRole.customer,
            ))
            db.commit()
            print("[Seed] Đã tạo tài khoản tester: username=tester, password=123")
        if not db.query(User).filter(User.username == "tester2").first():
            db.add(User(
                full_name="Tester 2",
                email="tester2@ticketrush.vn",
                username="tester2",
                hashed_password=hash_password("123"),
                role=UserRole.customer,
            ))
            db.commit()
            print("[Seed] Đã tạo tài khoản tester2: username=tester2, password=123")
    finally:
        db.close()


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "ok", "app": "TicketRush API", "version": "1.0.0"}
