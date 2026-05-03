# 🎫 TicketRush

<div align="center">

<img width="282" height="282" alt="ticketrush_cropped" src="https://github.com/user-attachments/assets/a91af2ab-8c60-428d-b5f8-006f8b28635e" />


**Nền tảng đặt vé sự kiện trực tuyến — nhanh chóng, dễ dàng, an toàn.**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-a855f7?style=flat-square)](LICENSE)

[Demo](#) · [Báo lỗi](issues) · [Đóng góp](contributing)

</div>

---

## 📋 Mục lục

- [Giới thiệu](#-giới-thiệu)
- [Tính năng](#-tính-năng)
- [Công nghệ](#-công-nghệ)
- [Kiến trúc](#-kiến-trúc)
- [Cài đặt](#-cài-đặt)
- [Cấu hình](#-cấu-hình)
- [Deploy](#-deploy)
- [API Docs](#-api-docs)
- [Cấu trúc thư mục](#-cấu-trúc-thư-mục)
- [Đóng góp](#-đóng-góp)

---

## 🎯 Giới thiệu

**TicketRush** là nền tảng đặt vé sự kiện trực tuyến full-stack, cho phép người dùng khám phá concerts, lễ hội, hội nghị — chọn chỗ ngồi trực quan trên sơ đồ ghế 2D và nhận vé QR ngay sau khi thanh toán.

Hệ thống được xây dựng với **phòng chờ ảo (virtual queue)** để xử lý lượng truy cập đột biến cho các sự kiện hot, đảm bảo trải nghiệm công bằng cho tất cả người dùng.

---

## ✨ Tính năng

### 👤 Người dùng
| Tính năng | Mô tả |
|-----------|-------|
| 🔍 **Tìm kiếm thông minh** | Tìm kiếm theo tên, nghệ sĩ, địa điểm với gợi ý real-time |
| 🪑 **Chọn ghế trực quan** | Sơ đồ ghế 2D tương tác, hiển thị trạng thái real-time |
| ⏳ **Phòng chờ ảo** | Hệ thống queue công bằng cho sự kiện có nhu cầu cao |
| 📱 **Vé QR** | Nhận vé điện tử kèm mã QR ngay sau thanh toán |
| 💳 **Thanh toán VietQR** | Chuyển khoản ngân hàng qua mã QR tự động |
| 🌙 **Dark / Light mode** | Giao diện thích ứng theo sở thích người dùng |

### 🛡️ Admin
| Tính năng | Mô tả |
|-----------|-------|
| 📊 **Dashboard tổng quan** | KPI, biểu đồ doanh thu, thống kê real-time |
| 🎪 **Quản lý sự kiện** | Tạo, chỉnh sửa, xóa sự kiện và khu vực ghế |
| 🤖 **AI Insights** | Phân tích dữ liệu kinh doanh bằng Gemini AI |
| 👥 **Phân tích khán giả** | Thống kê demographic: giới tính, độ tuổi |
| 🚦 **Quản lý queue** | Kiểm soát phòng chờ, admit hàng loạt |

---

## 🛠 Công nghệ

### Backend
- **[FastAPI](https://fastapi.tiangolo.com)** — Python web framework hiệu năng cao
- **[SQLAlchemy](https://sqlalchemy.org)** — ORM với PostgreSQL
- **[Supabase](https://supabase.com)** — PostgreSQL cloud hosting
- **[python-jose](https://github.com/mpdavis/python-jose)** — JWT authentication
- **[Passlib](https://passlib.readthedocs.io)** — Password hashing (bcrypt)
- **[WebSocket](https://fastapi.tiangolo.com/advanced/websockets/)** — Real-time seat map & queue

### Frontend
- **[React 18](https://react.dev)** + **[Vite](https://vitejs.dev)** — UI framework
- **[React Router v6](https://reactrouter.com)** — Client-side routing
- **[Tailwind CSS v3](https://tailwindcss.com)** — Utility-first styling
- **[Axios](https://axios-http.com)** — HTTP client

### AI & Integrations
- **[Google Gemini](https://ai.google.dev)** — AI-powered business insights
- **[VietQR](https://vietqr.io)** — Vietnam bank transfer QR generation
- **[QR Code](https://pypi.org/project/qrcode/)** — Ticket QR generation

---

## 🏗 Kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │  Browse  │  │ Seat Map │  │ Checkout │  │  Admin  │ │
│  │  Events  │  │  (2D)    │  │ + QR Pay │  │Dashboard│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
└───────┼─────────────┼──────────────┼──────────────┼──────┘
        │    REST API │              │   WebSocket  │
┌───────▼─────────────▼──────────────▼──────────────▼──────┐
│                   FastAPI Backend                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐  │
│  │  Events  │  │  Seats   │  │  Orders  │  │  Queue  │  │
│  │  Routes  │  │  Routes  │  │  Routes  │  │ Service │  │
│  └──────────┘  └──────────┘  └──────────┘  └─────────┘  │
│                    SQLAlchemy ORM                         │
└───────────────────────────┬───────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │   Supabase PostgreSQL  │
                │  (Cloud / Local Dev)   │
                └───────────────────────┘
```

---

## 🚀 Cài đặt

### Yêu cầu
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (hoặc Supabase account)

### 1. Clone repository

```bash
git clone https://github.com/your-username/ticketrush.git
cd ticketrush
```

### 2. Cài đặt Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
```

### 4. Khởi động

```bash
# Terminal 1 — Backend
cd backend
uvicorn main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Mở trình duyệt tại `http://localhost:5173`

---

## ⚙️ Cấu hình

Tạo file `.env` trong thư mục `backend/`:

```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/ticketrush

# Security
SECRET_KEY=your-super-secret-key-minimum-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# App
APP_ENV=development
APP_HOST=0.0.0.0
APP_PORT=8000

# Seat & Queue
SEAT_LOCK_MINUTES=10
QUEUE_BATCH_SIZE=50
QUEUE_ADMIT_INTERVAL_SECONDS=30

# VietQR (thanh toán)
BANK_ID=MB
BANK_ACCOUNT=0123456789
BANK_ACCOUNT_NAME=TICKETRUSH ENTERTAINMENT

# Email SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=TicketRush <no-reply@ticketrush.vn>

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## 🌐 Deploy

### Backend → Vercel

1. Tạo `vercel.json` ở root backend:

```json
{
  "builds": [{ "src": "main.py", "use": "@vercel/python" }],
  "routes": [{ "src": "/(.*)", "dest": "main.py" }]
}
```

2. Set environment variables trên Vercel Dashboard
3. Đổi `DATABASE_URL` sang Supabase Transaction Pooler (port 6543):

```
postgresql://postgres.[ref]:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
```

> ⚠️ **Lưu ý:** Vercel không hỗ trợ WebSocket. Nếu cần real-time queue/seat map, dùng **[Railway](https://railway.app)** hoặc **[Render](https://render.com)** thay thế.

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy thư mục dist/ lên Vercel
```

---

## 📖 API Docs

Sau khi chạy backend, truy cập:

| URL | Mô tả |
|-----|-------|
| `http://localhost:8000/docs` | Swagger UI — interactive API docs |
| `http://localhost:8000/redoc` | ReDoc — API reference |

### Các endpoint chính

```
POST   /api/auth/register          Đăng ký tài khoản
POST   /api/auth/login             Đăng nhập
GET    /api/events                 Danh sách sự kiện
GET    /api/events/{id}            Chi tiết sự kiện
GET    /api/events/{id}/seats      Sơ đồ ghế
POST   /api/orders                 Tạo đơn hàng
POST   /api/orders/{id}/pay        Xác nhận thanh toán
GET    /api/tickets                Vé của tôi
WS     /ws/seat-map/{event_id}     Real-time seat map
WS     /ws/queue/{event_id}        Real-time queue status
```

---

## 📁 Cấu trúc thư mục

```
ticketrush/
├── backend/
│   ├── main.py                 Entry point
│   ├── config.py               Settings & env
│   ├── database.py             DB connection
│   ├── vercel.json             Vercel config
│   ├── requirements.txt
│   ├── models/
│   │   ├── event.py
│   │   ├── seat.py
│   │   ├── order.py
│   │   ├── ticket.py
│   │   ├── user.py
│   │   └── queue.py
│   ├── routes/
│   │   ├── auth.py
│   │   ├── events.py
│   │   ├── seats.py
│   │   ├── orders.py
│   │   ├── tickets.py
│   │   └── admin.py
│   ├── schemas/
│   ├── services/
│   │   ├── queue_service.py
│   │   ├── ai_service.py
│   │   └── email_service.py
│   └── core/
│       └── deps.py
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── Home.jsx
    │   │   ├── EventDetail.jsx
    │   │   ├── SeatMap.jsx
    │   │   ├── Checkout.jsx
    │   │   ├── Tickets.jsx
    │   │   ├── Search.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   └── AdminEvents.jsx
    │   ├── components/
    │   │   ├── Header.jsx
    │   │   ├── EventCard.jsx
    │   │   └── ...
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   └── lib/
    │       └── api.js
    ├── index.html
    └── vite.config.js
```

---

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Vui lòng:

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/ten-tinh-nang`
3. Commit: `git commit -m 'feat: thêm tính năng X'`
4. Push: `git push origin feature/ten-tinh-nang`
5. Tạo Pull Request

---

## 📄 License

Distributed under the MIT License. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">

Made with ❤️ by the TicketRush Team

⭐ Star repo này nếu bạn thấy hữu ích!

</div>
