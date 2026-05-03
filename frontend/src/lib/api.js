/**
 * Lightweight fetch wrapper - giao tiếp với FastAPI backend qua Vite proxy /api
 * Tự động đính kèm JWT token và parse JSON lỗi thành Error message.
 */

const BASE = '/api'

function getToken() {
  return localStorage.getItem('ticketrush_token')
}

async function request(method, path, data) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: data !== undefined ? JSON.stringify(data) : undefined,
  })

  if (res.status === 204) return null

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const msg = json?.detail || `Request failed (${res.status})`
    let errMsg
    if (Array.isArray(msg)) {
      errMsg = msg.map((e) => `${e.loc?.slice(1).join('.')} - ${e.msg}`).join('; ')
    } else if (msg && typeof msg === 'object') {
      errMsg = msg.message || JSON.stringify(msg)
    } else {
      errMsg = String(msg)
    }
    const err = new Error(errMsg)
    err.status = res.status
    if (msg?.code) err.code = msg.code
    if (msg?.cooldown_until) err.cooldown_until = msg.cooldown_until
    throw err
  }

  return json
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, data) => request('POST', path, data),
  put: (path, data) => request('PUT', path, data),
  delete: (path) => request('DELETE', path),
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body) => api.post('/auth/login', body),
  register: (body) => api.post('/auth/register', body),
  me: () => api.get('/auth/me'),
  updateMe: (body) => api.put('/auth/me', body),
  forgotPassword: (body) => api.post('/auth/forgot-password', body),
  resetPassword: (body) => api.post('/auth/reset-password', body),
}

// ─── Events ────────────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params = '') => api.get(`/events${params}`),
  get: (id) => api.get(`/events/${id}`),
  seats: (id) => api.get(`/events/${id}/seats`),
}

// ─── Seats ─────────────────────────────────────────────────────────────────────
export const seatsApi = {
  lock: (seatIds) => api.post('/seats/lock', { seat_ids: seatIds }),
  unlock: (seatId) => api.delete(`/seats/lock/${seatId}`),
}

// ─── Orders ────────────────────────────────────────────────────────────────────
export const ordersApi = {
  create: (body) => api.post('/orders', body),
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  confirm: (id) => api.post(`/orders/${id}/confirm`),
  paymentQr: (id) => api.get(`/orders/${id}/payment-qr`),
  abandon: (id) => api.post(`/orders/${id}/abandon`),
}

// ─── Tickets ───────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list: () => api.get('/tickets'),
  get: (id) => api.get(`/tickets/${id}`),
}

// ─── Queue ─────────────────────────────────────────────────────────────────────
export const queueApi = {
  join: (eventId, sessionId) =>
    api.post(`/queue/${eventId}/join`, { session_id: sessionId }),
  status: (eventId, sessionId) =>
    api.get(`/queue/${eventId}/status?session_id=${sessionId}`),
  verifyToken: (eventId, token) =>
    api.post(`/queue/${eventId}/verify-token?token=${encodeURIComponent(token)}`),
}

// ─── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => api.get('/admin/dashboard'),
  eventDashboard: (eventId) => api.get(`/admin/dashboard/event/${eventId}`),
  aiInsights: (body) => api.post('/admin/ai-insights', body),
  events: {
    list: () => api.get('/admin/events'),
    get: (id) => api.get(`/admin/events/${id}`),
    create: (body) => api.post('/admin/events', body),
    update: (id, body) => api.put(`/admin/events/${id}`, body),
    delete: (id) => api.delete(`/admin/events/${id}`),
    createSection: (eventId, body) => api.post(`/admin/events/${eventId}/sections`, body),
    admitQueue: (eventId) => api.post(`/admin/events/${eventId}/queue/admit-all`),
    clearQueue: (eventId) => api.delete(`/admin/events/${eventId}/queue`),
  },
  sections: {
    update: (id, body) => api.put(`/admin/sections/${id}`, body),
    delete: (id) => api.delete(`/admin/sections/${id}`),
  },
  stats: {
    seats: (eventId) => api.get(`/admin/stats/seats/${eventId}`),
    revenue: (days = 30) => api.get(`/admin/stats/revenue?days=${days}`),
    audience: () => api.get('/admin/stats/audience'),
  },
}
