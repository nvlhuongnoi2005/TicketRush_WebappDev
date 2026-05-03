import hashlib
import os
import qrcode
from io import BytesIO
import base64
from core.config import settings


def generate_qr_data(ticket_id: int, user_id: int) -> str:
    """Tạo chuỗi dữ liệu duy nhất cho QR code (không thể giả mạo)."""
    raw = f"TICKETRUSH|TID={ticket_id}|UID={user_id}|{settings.SECRET_KEY}"
    checksum = hashlib.sha256(raw.encode()).hexdigest()[:16].upper()
    return f"TR-{ticket_id:06d}-{checksum}"


def generate_qr_base64(data: str) -> str:
    """Tạo ảnh QR và trả về dạng base64 data URL (lưu trực tiếp vào DB)."""
    img = qrcode.make(data)
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    b64 = base64.b64encode(buffer.getvalue()).decode()
    return f"data:image/png;base64,{b64}"


def save_qr_file(data: str, ticket_id: int, output_dir: str = "static/qr") -> str:
    """Lưu QR thành file PNG, trả về đường dẫn tương đối."""
    os.makedirs(output_dir, exist_ok=True)
    path = os.path.join(output_dir, f"ticket_{ticket_id}.png")
    img = qrcode.make(data)
    img.save(path)
    return f"/{path.replace(os.sep, '/')}"
