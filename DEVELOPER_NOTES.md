# TicketRush - Developer Notes

A reference for backend and frontend developers covering architecture, key functions, bugs fixed, and known issues.

---

## Architecture Overview

```
Frontend (React + Vite)               Backend (FastAPI + SQLite/PostgreSQL)
──────────────────────────────────    ────────────────────────────────────
frontend/src/pages/                   backend/routers/          ← HTTP routes
frontend/src/components/              backend/services/         ← business logic
frontend/src/context/                 backend/models/           ← SQLAlchemy ORM
frontend/src/lib/api.js     ──/api──  backend/schemas/          ← Pydantic I/O
frontend/src/lib/api.js     ──/ws──   backend/routers/ws.py     ← WebSocket
```

Vite proxies `/api` and `/ws` to `localhost:8000` during development (see `frontend/vite.config.js`).

**Key flow:** Event → (optional) Virtual Queue → Seat Map → Checkout → Tickets

---

## Running the Project

**Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
```

Default accounts seeded on first startup:
| Username | Password  | Role     |
|----------|-----------|----------|
| admin    | Admin@123 | admin    |
| tester   | 123       | customer |
| tester2  | 123       | customer |

---

## Backend - Key Functions

### `backend/services/seat_service.py`

**`lock_seats(db, seat_ids, user_id)`**  
Locks a list of seats for a user. Each seat is processed in an independent transaction so one failure doesn't roll back the whole batch. Returns `(success_ids, failed_ids)`.

Concurrency strategy:
- **SQLite (dev):** `threading.Lock()` - only one thread writes at a time.
- **PostgreSQL (prod):** `SELECT ... FOR UPDATE NOWAIT` - database enforces row-level locking; concurrent requests get an `OperationalError` and are added to `failed_ids`.

**`release_expired_seats(db)`**  
Called by the scheduler every 30 s. Resets any `locked` seat whose `lock_expires_at` is in the past back to `available`.

---

### `backend/services/order_service.py`

**`create_order(db, user_id, seat_ids)`**  
Idempotent. If the user already has a `pending` order containing exactly the same seats, the existing order is returned instead of creating a duplicate. This protects against React double-invocation and network retries.

**`confirm_order(db, order_id, user_id)`**  
Marks each seat as `sold`, generates QR tickets, and sets the order status to `paid`. Uses `db.flush()` to get the real ticket ID before generating the final QR.

---

### `backend/services/queue_service.py`

**`join_queue(db, event_id, session_id, user_id)`**  
Idempotent by `session_id`. If the user's token has expired, re-queues them at the end.

**`admit_next_batch(db, event_id)`**  
Admits the next `QUEUE_BATCH_SIZE` (default: 50) users in line. Each gets a `secrets.token_urlsafe(32)` access token valid for 20 minutes. Called by the scheduler **and** immediately on every `join` and `status` poll - this ensures position-1 users are admitted within seconds, not up to 30 s.

**`verify_queue_token(db, event_id, token)`**  
Called before the seat map is shown. Checks the token exists, belongs to an admitted entry, and hasn't expired.

---

### `backend/routers/queue.py`

`admit_next_batch` is called inline on every `/join` and every `/status` poll:

```python
# join endpoint
entry = join_queue(db, event_id, body.session_id, user_id)
if not entry.is_admitted:
    admit_next_batch(db, event_id)   # admit immediately if position 1

# status endpoint
if not status["is_admitted"]:
    admit_next_batch(db, event_id)   # keep trying until admitted
    status = get_queue_status(...)
```

---

### `backend/routers/ws.py`

Broadcasts seat status to all connected clients for a given event every 1 second. Clients receive `{ event: "seat_update", data: [{seat_id, status}, ...] }`.

---

### `backend/core/config.py` - Tunable settings

| Setting | Default | Description |
|---------|---------|-------------|
| `SEAT_LOCK_MINUTES` | 10 | How long a seat hold lasts |
| `QUEUE_BATCH_SIZE` | 50 | Users admitted per batch |
| `QUEUE_ADMIT_INTERVAL_SECONDS` | 30 | Scheduler interval |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | 1440 | JWT lifetime (24 h) |

Override via `backend/.env`.

---

## Project Structure

```
TicketRush/
├── backend/          ← FastAPI app
├── frontend/         ← React + Vite app
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── DEVELOPER_NOTES.md
├── README.md
├── SPECIFICATIONS.md
└── .gitignore
```

---

## Frontend - Key Functions

### `src/lib/api.js`

Single `request(method, path, data)` wrapper. Automatically attaches the JWT from `localStorage` and parses FastAPI 422 validation errors into human-readable field messages:

```js
if (Array.isArray(msg)) {
  errMsg = msg.map((e) => `${e.loc?.slice(1).join('.')} - ${e.msg}`).join('; ')
}
```

---

### `src/context/QueueContext.jsx`

Manages virtual-queue access tokens across all pages. Tokens survive page refresh via `sessionStorage` (cleared when the browser tab closes).

Key functions:
- `hasAccessToken(eventId)` - returns `true` if a valid non-expired token exists.
- `storeAccessToken(eventId, token, expiresAt)` - normalizes the `expiresAt` string (see UTC bug below) and saves to state + sessionStorage.
- `clearAccessToken(eventId)` - called when the token expires on the seat map.
- `loadStoredTokens()` - migrates any previously stored entries that are missing the `'Z'` UTC suffix.

---

### `src/pages/SeatMap.jsx`

**`parseUTCMs(s)`** - helper at the top of the file. Appends `'Z'` to naive UTC datetime strings from the backend before parsing, ensuring correct millisecond timestamps regardless of the client's timezone.

```js
function parseUTCMs(s) {
  if (!s) return null
  const str = s.endsWith('Z') || s.includes('+') ? s : s + 'Z'
  return new Date(str).getTime()
}
```

**WebSocket effect** - subscribes to `/ws/events/{eventId}/seats` and patches the seat grid in real time without a full reload.

**Lock-expiry effect** - schedules a `setTimeout` based on `lockExpiresAt` to clear the local selection when the hold expires.

**Queue-expiry effect** - schedules a redirect back to the waiting room when the queue access token expires.

---

### `src/pages/WaitingRoom.jsx`

On mount, immediately redirects to the seat map if a valid token already exists (handles page refresh case). Otherwise:
1. `POST /api/queue/{eventId}/join` - joins or re-joins the queue.
2. Polls `GET /api/queue/{eventId}/status` every 2 s.
3. On `is_admitted`, stores the token and navigates to the seat map.

---

### `src/pages/Checkout.jsx`

**No `useEffect`** - all side-effects are triggered by button clicks only.  
**Two-step flow:** "Place order" button → QR code appears → "Confirm payment" button.

`placingRef` (a `useRef`) prevents duplicate order creation on rapid clicks or React's double-invocation in development:

```js
const handlePlaceOrder = async () => {
  if (order || placingRef.current) return   // guard
  placingRef.current = true
  // ... create order
  placingRef.current = false
}
```

Auth guard is done synchronously at render time (`if (!user) { navigate(...); return null }`) rather than inside an effect - avoids the order-creation effect running before the redirect fires.

---

## Bugs Fixed

### 1. Seats vanishing immediately after selection / redirect to waiting room on seat click

**Symptom:** Selected seat appeared briefly then disappeared. The app sometimes redirected back to the waiting room on seat click.

**Root cause:** Python's `datetime.utcnow()` returns a *naive* datetime with no timezone info. SQLAlchemy serializes it as `"2024-01-01T12:00:00"` (no `'Z'`). JavaScript's `new Date("2024-01-01T12:00:00")` treats this as **local time** (UTC+7 adds 7 hours), making `lock_expires_at` appear to be in the future by +7 h when it should be, and vice-versa for values near "now" - the lock would look already expired, triggering immediate seat release. Similarly, queue tokens appeared expired on arrival, causing the waiting-room redirect.

**Fix:** Append `'Z'` to any datetime string that lacks a timezone indicator before parsing.
- `parseUTCMs()` in `SeatMap.jsx`
- `normalizeUTC()` + `storeAccessToken` normalization + `loadStoredTokens` migration in `QueueContext.jsx`

---

### 2. 422 Unprocessable Entity on POST /api/orders

**Symptom:** "Place order" button returned a 422 error.

**Root cause:** `OrderCreate` Pydantic schema had `event_id: int` (required), but the frontend wasn't sending it.

**Fix:** Changed to `event_id: Optional[int] = None` in `backend/schemas/order.py`. The service layer doesn't use `event_id` - it's derived from the seats - so making it optional is correct.

---

### 3. Checkout page reloading continuously / duplicate orders

**Symptom:** The `/checkout` page triggered an infinite loop of order creation. Each reload created a new order; the counter grew unbounded.

**Root cause:** React 18 `StrictMode` deliberately double-invokes `useEffect` in development to surface side-effect bugs. The previous implementation placed `ordersApi.create()` inside a `useEffect`, so it ran twice per mount. A `useRef` guard blocked the second run, but when StrictMode simulated an unmount/remount, state (including `loading`) reset while the ref didn't - leaving the UI stuck. The backend also lacked idempotency, so each call created a new order.

**Fix (frontend):** Removed `useEffect` entirely. The order is created only when the user explicitly clicks "Place order". `placingRef` guards against rapid double-clicks.

**Fix (backend):** `create_order` now returns the existing `pending` order if it covers the same seats, making it safe to call multiple times.

---

### 4. Queue position 1 waiting up to 30 seconds

**Symptom:** Users at position 1 in the queue had to wait a full 30-second scheduler cycle before being admitted.

**Root cause:** `admit_next_batch` was only called by the background scheduler, which runs every 30 s.

**Fix:** Call `admit_next_batch` inline on every `join` and every `status` poll request. The scheduler is still running as a fallback but is no longer the only admission path.

---

## Known Issues / Things to Address

- **`datetime.utcnow()` is deprecated** in Python 3.12+. All usages should be migrated to `datetime.now(timezone.utc)` and the Pydantic models updated to use timezone-aware datetimes. This will also eliminate the need for the `'Z'` normalization on the frontend.

- **SQLite is not suitable for production.** The `threading.Lock()` in `seat_service.py` protects against concurrent writes in a single-process dev server but will not work across multiple workers or machines. Switch to PostgreSQL and the `SELECT FOR UPDATE NOWAIT` path is already implemented.

- **`allow_origins=["*"]` in CORS** - acceptable for development but must be restricted to your actual frontend domain before going to production.

- **`SECRET_KEY` default value** - must be changed via the `.env` file before deployment. Any JWT signed with the default key can be forged.

- **Queue token storage in `sessionStorage`** - tokens are lost when the browser tab is closed. This is intentional (security) but means a user who closes the tab must re-queue. Consider whether this UX is acceptable.

- **QR code images stored as base64 in the database** - works for a prototype but will inflate the database quickly at scale. Move to file storage (S3 or local disk) for production.

- **No payment verification** - the current flow shows a bank-transfer QR and lets the user self-confirm payment. In production you need a webhook from your payment provider to confirm before issuing tickets.

- **Debug `console.log` statements** remain in `SeatMap.jsx` inside the `toggleSeat` function - remove before shipping.

- **Admin panel** is unprotected at the route level - any logged-in user who knows the URL can navigate to `/admin`. The API routes check `UserRole.admin`, but the frontend should redirect non-admins away.
