# QUY HOẠCH PHẦN MỀM - TICKETRUSH

## 1. TÍNH NĂNG CHÍNH

### AUTH

#### ĐĂNG NHẬP
| Thành phần | Mô tả | Tham khảo | Lưu ý |
|-----------|-------|----------|-------|
| Tên đăng nhập | Input text | nutrimate | |
| Mật khẩu | Input password (ẩn ký tự) | | |
| Button ĐĂNG NHẬP | Gọi POST /api/auth/login | | Hiện Alert nếu sai |
| Link Đăng ký | Chuyển sang trang Register | | |
| Link Quên mật khẩu | Fix cứng / future feature | | |
| Alert lỗi | Toast "Tài khoản hoặc mật khẩu không đúng!" | | |
| Alert thành công | Toast "Đăng nhập thành công!" | | |

#### ĐĂNG KÝ
| Thành phần | Mô tả | Lưu ý |
|-----------|-------|-------|
| Họ & tên | Input text | |
| Email | Input email (validate format) | |
| Số điện thoại | Input tel (optional) | |
| Ngày sinh | Input dd/mm/yyyy hoặc DatePicker | Dùng để thống kê độ tuổi |
| Giới tính | Select: Nam / Nữ / Khác | Dùng cho thống kê Admin |
| Tên đăng nhập | Input text (unique) | |
| Mật khẩu | Input password | Min 8 ký tự |
| Button ĐĂNG KÝ | Gọi POST /api/auth/register | |

### TRANG CHỦ

#### DANH SÁCH SỰ KIỆN
| Thành phần | Mô tả | Tham khảo | Lưu ý |
|-----------|-------|----------|-------|
| Search bar | Input tìm kiếm theo tên / nghệ sĩ | Ví dụ: 'BLACKPINK' | |
| Filter trạng thái | Dropdown: Tất cả / Đang mở bán / Sắp diễn ra | | |
| Thẻ sự kiện | Ảnh banner, tên event, ngày, địa điểm, giá thấp nhất, % ghế còn | Poster concert | |
| Badge trạng thái | on_sale = xanh / sold_out = đỏ / finished = xám | | |
| Button Xem chi tiết | Chuyển sang Event Detail | | |

### CHI TIẾT SỰ KIỆN

#### THÔNG TIN
| Thành phần | Mô tả | Lưu ý |
|-----------|-------|-------|
| Banner ảnh lớn | Hiển thị banner_url | |
| Tên sự kiện / Nghệ sĩ | Text header lớn | |
| Ngày giờ, địa điểm | Text + icon | |
| Mô tả sự kiện | Text dài, có thể collapsible | |
| Danh sách khu vực ghế | Thẻ mỗi khu: tên, giá, màu, ghế còn lại | VIP - 800,000đ |
| Button Chọn ghế | Chuyển sang Seat Map. Nếu queue_enabled → vào hàng chờ trước | |

### SƠ ĐỒ GHẾ

#### CHỌN GHẾ
| Thành phần | Mô tả | Lưu ý |
|-----------|-------|-------|
| Canvas/Grid sơ đồ ghế | Mỗi ô = 1 ghế, màu theo section.color | Không F5 - dùng WS/polling |
| Trạng thái ghế | available=xanh / locked=vàng / sold=đỏ / locked_by_me=xanh đậm | |
| Legend màu sắc | Chú thích các trạng thái ghế | |
| Panel ghế đã chọn | Danh sách ghế đang chọn, tổng tiền | |
| Button Giữ chỗ | Gọi POST /api/seats/lock, đếm ngược 10 phút | Disable khi đã chọn ≥ ghế limit |
| Button Tiến hành thanh toán | Chuyển sang Checkout | |
| Đồng hồ đếm ngược | Hiện thời gian còn lại để thanh toán (mm:ss) | |

### THANH TOÁN

#### CHECKOUT
| Thành phần | Mô tả |
|-----------|-------|
| Tóm tắt đơn hàng | Danh sách ghế, khu vực, giá từng vé |
| Tổng tiền | Text lớn nổi bật |
| Thông tin người mua | Tên, email (auto-fill từ profile) |
| Button TẠO ĐƠN HÀNG | Gọi POST /api/orders |
| Button XÁC NHẬN THANH TOÁN | Gọi POST /api/orders/{id}/confirm (mô phỏng thanh toán thật) |
| Alert thành công | Toast "Đặt vé thành công! Xem vé của bạn" |

### VÉ CỦA TÔI

#### DANH SÁCH VÉ
| Thành phần | Mô tả |
|-----------|-------|
| Thẻ vé | Ảnh QR, tên event, ngày, khu vực, ghế, giá |
| Badge trạng thái vé | valid=xanh / used=xám / cancelled=đỏ |
| Button Xem chi tiết vé | Mở modal/trang chi tiết vé |

#### CHI TIẾT VÉ
| Thành phần | Mô tả | Lưu ý |
|-----------|-------|-------|
| QR Code lớn | Hiển thị ảnh QR từ GET /api/tickets/{id}/qr | Dùng để quét vào cổng |
| Mã vé | Text: TR-000001-XXXXXXXX | |
| Thông tin sự kiện | Tên, ngày, địa điểm, khu vực, ghế | |
| Button Tải QR | Download ảnh PNG | |

### HÀNG CHỜ ẢO

#### WAITING ROOM
| Thành phần | Mô tả | Lưu ý |
|-----------|-------|-------|
| Text vị trí | "Bạn đang ở vị trí thứ 105 trong hàng đợi" | |
| Progress bar | Hiển thị % vị trí trong tổng hàng chờ | |
| Polling auto | Frontend tự gọi GET /api/queue/{id}/status mỗi 3s | Không F5 |
| Thông báo được vào | Alert: "Bạn đã được vào! Hãy tiến hành chọn ghế." | Kèm access_token |

### ADMIN

#### QUẢN LÝ SỰ KIỆN
| Thành phần | Mô tả | Lưu ý |
|-----------|-------|-------|
| Bảng danh sách sự kiện | ID, tên, ngày, trạng thái, số ghế | |
| Button Tạo sự kiện | Mở form tạo mới, gọi POST /api/admin/events | |
| Form sự kiện | title, artist, venue, event_date, sale_start/end, banner, queue_enabled | |
| Button Sửa | Gọi PUT /api/admin/events/{id} | |
| Button Xóa | Gọi DELETE /api/admin/events/{id} + confirm dialog | |
| Button Thêm khu vực ghế | Mở form: tên khu, rows, cols, giá, màu. Gọi POST /api/admin/events/{id}/sections | Auto-gen ma trận ghế |

#### DASHBOARD REAL-TIME
| Thành phần | Mô tả |
|-----------|-------|
| Thẻ tổng quan | 4 KPI: Tổng sự kiện / Đang mở bán / Vé đã bán / Doanh thu |
| Biểu đồ doanh thu 7 ngày | Line chart từ GET /api/admin/stats/revenue?days=7 |
| Biểu đồ tình trạng ghế | Bar chart per section từ GET /api/admin/stats/seats/{event_id} |
| Dropdown chọn sự kiện | Lọc biểu đồ ghế theo sự kiện |
| Auto-refresh | Polling dashboard mỗi 10s |

#### THỐNG KÊ KHÁN GIẢ
| Thành phần | Mô tả |
|-----------|-------|
| Biểu đồ tròn giới tính | Nam / Nữ / Khác - từ GET /api/admin/stats/audience |
| Biểu đồ cột độ tuổi | <18 / 18-25 / 26-35 / 36-45 / >45 |
| Số lượng từng nhóm | Text kèm biểu đồ |

---

## 2. API ENDPOINTS

### Authentication

#### POST /api/auth/register
Đăng ký tài khoản mới

**Request:**
```json
{
  "full_name": "Nguyen Van A",
  "email": "a@mail.com",
  "phone": "0901234567",
  "dob": "01/01/2000",
  "gender": "male",
  "username": "nguyenvana",
  "password": "Pass@123"
}
```

**Success (200/201):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "full_name": "Nguyen Van A",
    "username": "nguyenvana",
    "role": "customer"
  }
}
```

**Error:**
```json
{"detail": "Username đã tồn tại"}
```

#### POST /api/auth/login
Đăng nhập, nhận JWT token

**Request:**
```json
{
  "username": "nguyenvana",
  "password": "Pass@123"
}
```

**Success (200):**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {"id": 2, "role": "customer"}
}
```

**Error:**
```json
{"detail": "Tài khoản hoặc mật khẩu không đúng!"}
```

#### GET /api/auth/me
Lấy thông tin người dùng hiện tại

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "id": 2,
  "full_name": "Nguyen Van A",
  "email": "a@mail.com",
  "username": "nguyenvana",
  "role": "customer"
}
```

#### PUT /api/auth/me
Cập nhật thông tin cá nhân

**Request:**
```json
{
  "full_name": "Nguyen Van B",
  "phone": "0909999888"
}
```

### Events

#### GET /api/events
Danh sách sự kiện đang mở bán (có search và filter)

**Query:** `?search=blackpink&status=on_sale`

**Success (200):**
```json
[
  {
    "id": 1,
    "title": "BLACKPINK World Tour",
    "artist": "BLACKPINK",
    "venue_name": "Sân Mỹ Đình",
    "event_date": "2026-06-15T19:00:00",
    "status": "on_sale",
    "min_price": 800000,
    "total_seats": 5000,
    "available_seats": 3200
  }
]
```

#### GET /api/events/{event_id}
Chi tiết sự kiện kèm danh sách khu vực ghế

**Success (200):**
```json
{
  "id": 1,
  "title": "BLACKPINK World Tour",
  "sections": [
    {
      "id": 1,
      "name": "VIP",
      "rows": 5,
      "cols": 20,
      "price": 2000000,
      "color": "#E94560",
      "total_seats": 100,
      "available_seats": 65
    }
  ]
}
```

#### GET /api/events/{event_id}/seats
Sơ đồ ghế đầy đủ (dùng cho polling cập nhật trạng thái ghế)

**Success (200):**
```json
{
  "event_id": 1,
  "sections": [
    {
      "section_id": 1,
      "section_name": "VIP",
      "seats": [
        {
          "id": 101,
          "label": "VIP-A01",
          "status": "available",
          "price": 2000000,
          "locked_by_me": false
        }
      ]
    }
  ]
}
```

### Seats

#### POST /api/seats/lock
Khóa (giữ chỗ) nhiều ghế cùng lúc

**Request:**
```json
{
  "seat_ids": [101, 102, 103]
}
```

**Success (200):**
```json
{
  "success": [101, 102],
  "failed": [103],
  "lock_expires_at": "2026-06-15T19:10:00"
}
```

#### DELETE /api/seats/lock/{seat_id}
Nhả ghế đang giữ (hủy chọn ghế)

**Success:** 204 No Content

### Orders

#### POST /api/orders
Tạo đơn hàng từ các ghế đang locked

**Request:**
```json
{
  "seat_ids": [101, 102],
  "event_id": 1
}
```

**Success (201):**
```json
{
  "id": 5,
  "total_amount": 4000000,
  "status": "pending",
  "expires_at": "2026-06-15T19:10:00",
  "items": [
    {"seat_id": 101, "seat_label": "VIP-A01", "price": 2000000}
  ]
}
```

#### GET /api/orders
Danh sách đơn hàng của user hiện tại

**Success (200):**
```json
[
  {
    "id": 5,
    "total_amount": 4000000,
    "status": "paid",
    "paid_at": "2026-06-15T19:05:00"
  }
]
```

#### GET /api/orders/{order_id}
Chi tiết một đơn hàng

#### POST /api/orders/{order_id}/confirm
XÁC NHẬN THANH TOÁN (mô phỏng) → ghế → sold, cấp vé + QR

**Success (200):**
```json
{
  "id": 5,
  "status": "paid",
  "paid_at": "2026-06-15T19:05:00"
}
```

### Tickets

#### GET /api/tickets
Danh sách vé điện tử của user

**Success (200):**
```json
[
  {
    "id": 1,
    "event_title": "BLACKPINK World Tour",
    "seat_label": "VIP-A01",
    "qr_data": "TR-000001-ABCD1234",
    "status": "valid",
    "price": 2000000
  }
]
```

#### GET /api/tickets/{ticket_id}
Chi tiết vé kèm thông tin sự kiện và QR

**Success (200):**
```json
{
  "id": 1,
  "event_title": "BLACKPINK World Tour",
  "event_date": "2026-06-15T19:00:00",
  "venue_name": "Sân Mỹ Đình",
  "seat_label": "VIP-A01",
  "section_name": "VIP",
  "qr_data": "TR-000001-ABCD1234",
  "qr_image_url": "data:image/png;base64,...",
  "status": "valid"
}
```

#### GET /api/tickets/{ticket_id}/qr
Trả về ảnh QR PNG binary (để download hoặc hiển thị)

**Success:** 200 image/png (binary)

### Admin - Events

#### POST /api/admin/events
Tạo sự kiện mới

**Request:**
```json
{
  "title": "BLACKPINK World Tour",
  "artist": "BLACKPINK",
  "venue_name": "Sân Mỹ Đình",
  "venue_address": "Hà Nội",
  "event_date": "2026-06-15T19:00:00",
  "sale_start": "2026-05-01T00:00:00",
  "sale_end": "2026-06-15T18:00:00",
  "queue_enabled": true
}
```

#### PUT /api/admin/events/{event_id}
Cập nhật thông tin sự kiện (kể cả đổi status)

#### DELETE /api/admin/events/{event_id}
Xóa sự kiện và toàn bộ ghế liên quan

#### POST /api/admin/events/{event_id}/sections
Thêm khu vực ghế - tự động sinh ma trận rows×cols ghế

**Request:**
```json
{
  "name": "VIP",
  "rows": 5,
  "cols": 20,
  "price": 2000000,
  "color": "#E94560"
}
```

#### PUT /api/admin/sections/{section_id}
Cập nhật khu vực ghế (giá, màu, tên)

#### DELETE /api/admin/sections/{section_id}
Xóa khu vực ghế

### Admin - Dashboard

#### GET /api/admin/dashboard
Tổng quan hệ thống: KPI cards + doanh thu 7 ngày gần nhất

**Success (200):**
```json
{
  "total_events": 5,
  "active_events": 2,
  "total_tickets_sold": 1250,
  "total_revenue": 2500000000,
  "pending_orders": 8,
  "recent_revenue": [
    {"date": "2026-04-22", "revenue": 50000000, "tickets_sold": 25}
  ]
}
```

#### GET /api/admin/stats/seats/{event_id}
Tình trạng lấp đầy ghế theo khu vực cho một sự kiện (real-time)

**Success (200):**
```json
[
  {
    "section_name": "VIP",
    "total": 100,
    "sold": 65,
    "locked": 10,
    "available": 25,
    "fill_pct": 65.0
  }
]
```

#### GET /api/admin/stats/revenue
Doanh thu theo ngày (mặc định 30 ngày)

**Query:** `?days=30`

#### GET /api/admin/stats/audience
Thống kê khán giả theo giới tính và độ tuổi

**Success (200):**
```json
{
  "gender_male": 650,
  "gender_female": 580,
  "gender_other": 20,
  "age_under_18": 120,
  "age_18_25": 480,
  "age_26_35": 390,
  "age_36_45": 180,
  "age_above_45": 80
}
```

### Virtual Queue

#### POST /api/queue/{event_id}/join
Tham gia hàng chờ ảo (khi event có queue_enabled=true)

**Request:**
```json
{
  "session_id": "uuid-v4-từ-client"
}
```

**Success (200):**
```json
{
  "session_id": "uuid-v4-từ-client",
  "position": 105,
  "total_in_queue": 312,
  "is_admitted": false,
  "message": "Bạn đang ở vị trí thứ 105 trong hàng đợi..."
}
```

#### GET /api/queue/{event_id}/status
Kiểm tra vị trí trong hàng chờ (polling mỗi 3 giây từ frontend)

**Query:** `?session_id=uuid-v4-từ-client`

**Success (200):**
```json
{
  "position": 50,
  "total_in_queue": 200,
  "is_admitted": false,
  "message": "Bạn đang ở vị trí thứ 50..."
}
```

Khi được vào:
```json
{
  "is_admitted": true,
  "access_token": "rand_token_32chars",
  "token_expires_at": "2026-06-15T19:15:00",
  "message": "Bạn đã được vào! Hãy tiến hành chọn ghế."
}
```

#### POST /api/queue/{event_id}/verify-token
Xác thực access_token trước khi vào màn hình chọn ghế

**Query:** `?token=rand_token_32chars`

**Success (200):**
```json
{"valid": true}
```

### WebSocket

#### WS /ws/events/{event_id}/seats
Kết nối WebSocket - server push trạng thái ghế mỗi 2 giây

**Message:**
```json
{
  "event": "seat_update",
  "data": [
    {"seat_id": 101, "status": "locked", "label": "VIP-A01"},
    {"seat_id": 102, "status": "available", "label": "VIP-A02"}
  ]
}
```

---

## 3. DATABASE SCHEMA

### users
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| full_name | VARCHAR(100) | Họ và tên | NOT NULL |
| email | VARCHAR(100) | Email đăng nhập | UNIQUE, NOT NULL |
| phone | VARCHAR(20) | Số điện thoại | NULLABLE |
| dob | VARCHAR(10) | Ngày sinh dd/mm/yyyy | NULLABLE |
| gender | VARCHAR(10) | Giới tính: male/female/other | NULLABLE |
| username | VARCHAR(50) | Tên đăng nhập | UNIQUE, NOT NULL |
| hashed_password | VARCHAR(255) | Mật khẩu đã hash bcrypt | NOT NULL |
| role | ENUM | customer \| admin | DEFAULT customer |
| is_active | BOOLEAN | Trạng thái tài khoản | DEFAULT True |
| created_at | DATETIME | Thời gian tạo | DEFAULT utcnow |

### events
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| title | VARCHAR(200) | Tên sự kiện | NOT NULL |
| description | TEXT | Mô tả sự kiện | NULLABLE |
| artist | VARCHAR(200) | Tên nghệ sĩ / ban nhạc | NULLABLE |
| venue_name | VARCHAR(200) | Tên địa điểm | NOT NULL |
| venue_address | VARCHAR(500) | Địa chỉ đầy đủ | NULLABLE |
| event_date | DATETIME | Ngày giờ diễn ra | NOT NULL |
| sale_start | DATETIME | Thời gian mở bán | NULLABLE |
| sale_end | DATETIME | Thời gian đóng bán | NULLABLE |
| banner_url | VARCHAR(500) | URL ảnh banner | NULLABLE |
| status | ENUM | draft\|on_sale\|sold_out\|finished\|cancelled | DEFAULT draft |
| queue_enabled | BOOLEAN | Bật hàng chờ ảo | DEFAULT False |
| created_by | INTEGER | FK → users.id (admin tạo) | FK |

### seat_sections
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| event_id | INTEGER | FK → events.id | FK, NOT NULL |
| name | VARCHAR(50) | Tên khu: VIP, Khu A... | NOT NULL |
| rows | INTEGER | Số hàng ghế | NOT NULL |
| cols | INTEGER | Số ghế mỗi hàng | NOT NULL |
| price | FLOAT | Giá vé khu này (VND) | NOT NULL |
| color | VARCHAR(20) | Màu hex hiển thị trên frontend | DEFAULT #4CAF50 |

### seats
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| section_id | INTEGER | FK → seat_sections.id | FK, NOT NULL |
| row_num | INTEGER | Số hàng (1-based) | NOT NULL |
| col_num | INTEGER | Số cột (1-based) | NOT NULL |
| label | VARCHAR(20) | Nhãn ghế: VIP-A01 | |
| status | ENUM | available \| locked \| sold | DEFAULT available |
| locked_by | INTEGER | FK → users.id (người đang giữ) | NULLABLE |
| locked_at | DATETIME | Thời điểm bắt đầu giữ ghế | NULLABLE |
| lock_expires_at | DATETIME | Thời điểm hết hạn giữ ghế (+10 phút) | NULLABLE |

### orders
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| user_id | INTEGER | FK → users.id | FK, NOT NULL |
| total_amount | FLOAT | Tổng tiền đơn hàng (VND) | DEFAULT 0 |
| status | ENUM | pending \| paid \| cancelled | DEFAULT pending |
| created_at | DATETIME | Thời điểm tạo đơn | DEFAULT utcnow |
| expires_at | DATETIME | Hết hạn thanh toán (+10 phút) | |
| paid_at | DATETIME | Thời điểm thanh toán thành công | NULLABLE |

### order_items
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| order_id | INTEGER | FK → orders.id | FK, NOT NULL |
| seat_id | INTEGER | FK → seats.id (1 dòng = 1 ghế) | FK, NOT NULL |
| price | FLOAT | Giá tại thời điểm mua | NOT NULL |

### tickets
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| order_id | INTEGER | FK → orders.id | FK, NOT NULL |
| seat_id | INTEGER | FK → seats.id | FK, NOT NULL |
| event_id | INTEGER | FK → events.id | FK, NOT NULL |
| user_id | INTEGER | FK → users.id | FK, NOT NULL |
| qr_data | VARCHAR(200) | Chuỗi dữ liệu QR: TR-000001-XXXXXXXX | |
| qr_image_url | VARCHAR(500) | Base64 data URL ảnh QR PNG | |
| status | ENUM | valid \| used \| cancelled | DEFAULT valid |
| price | FLOAT | Giá vé | NOT NULL |
| issued_at | DATETIME | Thời điểm phát vé | DEFAULT utcnow |

### queue_entries
| Cột | Kiểu | Mô tả | Ràng buộc |
|-----|------|-------|----------|
| id | INTEGER | Khóa chính | PK, AUTO |
| event_id | INTEGER | FK → events.id | FK, NOT NULL |
| user_id | INTEGER | FK → users.id | NULLABLE (khách vãng lai) |
| session_id | VARCHAR(100) | UUID do client tạo | INDEX, NOT NULL |
| position | INTEGER | Vị trí trong hàng chờ | NOT NULL |
| is_admitted | BOOLEAN | Đã được cấp quyền vào chưa | DEFAULT False |
| access_token | VARCHAR(200) | Token 15 phút để vào chọn ghế | NULLABLE |
| token_expires_at | DATETIME | Hết hạn token | NULLABLE |
| joined_at | DATETIME | Thời điểm tham gia hàng chờ | DEFAULT utcnow |
