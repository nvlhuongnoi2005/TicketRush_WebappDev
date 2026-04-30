"""
Chạy script này một lần để khởi tạo database trắng:
    python init_db.py

Tạo file ticketrush.db với toàn bộ schema và các tài khoản mặc định:
    - admin / Admin@123  (role: admin)
    - tester / 123       (role: customer)
    - tester2 / 123      (role: customer)
"""

import os
import sys

# Đảm bảo chạy từ thư mục backend/
script_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(script_dir)

from database import init_db, SessionLocal
from models.user import User, UserRole
from core.security import hash_password

DB_PATH = "ticketrush.db"

if os.path.exists(DB_PATH):
    answer = input(f"File '{DB_PATH}' đã tồn tại. Ghi đè? [y/N] ").strip().lower()
    if answer != "y":
        print("Hủy.")
        sys.exit(0)
    os.remove(DB_PATH)
    print(f"Đã xoá '{DB_PATH}' cũ.")

print("Đang tạo schema...")
init_db()

print("Đang tạo tài khoản seed...")
db = SessionLocal()
try:
    seed_users = [
        User(
            full_name="Admin TicketRush",
            email="admin@ticketrush.vn",
            username="admin",
            hashed_password=hash_password("Admin@123"),
            role=UserRole.admin,
        ),
        User(
            full_name="Tester User",
            email="tester@ticketrush.vn",
            username="tester",
            hashed_password=hash_password("123"),
            role=UserRole.customer,
        ),
        User(
            full_name="Tester 2",
            email="tester2@ticketrush.vn",
            username="tester2",
            hashed_password=hash_password("123"),
            role=UserRole.customer,
        ),
    ]
    db.add_all(seed_users)
    db.commit()
finally:
    db.close()

print()
print(f"Done! '{DB_PATH}' đã sẵn sàng.")
print()
print("Tài khoản mặc định:")
print("  admin   / Admin@123  (admin)")
print("  tester  / 123        (customer)")
print("  tester2 / 123        (customer)")
