import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const CSS = `
@keyframes aeFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes aeScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes aeShimmer {
  0%,100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
.ae-fade-up  { animation: aeFadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
.ae-scale-in { animation: aeScaleIn 0.4s cubic-bezier(.22,1,.36,1) both; }
.ae-hero-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: aeShimmer 14s ease infinite;
}
button:not(:disabled), a, select, input, textarea { cursor: auto; }
button:not(:disabled), a, select { cursor: pointer; }
`

const STATUS_CFG = {
  draft: { label: 'Nháp', cls: 'bg-slate-100 text-slate-600 border-slate-200', dCls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  on_sale: { label: 'Đang bán', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dCls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  sold_out: { label: 'Hết vé', cls: 'bg-rose-50 text-rose-700 border-rose-200', dCls: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
  finished: { label: 'Đã kết thúc', cls: 'bg-slate-100 text-slate-500 border-slate-200', dCls: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  cancelled: { label: 'Đã hủy', cls: 'bg-orange-50 text-orange-700 border-orange-200', dCls: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
}

// Bỏ "Nháp" khỏi filter
const STATUS_FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'on_sale', label: 'Đang bán' },
  { value: 'sold_out', label: 'Hết vé' },
  { value: 'finished', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const emptyForm = {
  title: '', artist: '', venue_name: '', venue_address: '', event_date: '',
  sale_start: '', sale_end: '', banner_url: '', status: 'draft',
  queue_enabled: false, description: '',
}

const Icon = {
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="7" cy="7" r="5" /><path d="m11 11 3 3" /></svg>,
  edit: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M11 2.5l2.5 2.5-8 8H3v-2.5z" /><path d="M9.5 4l2.5 2.5" /></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2.5 4h11M6 4V2.5h4V4M4 4l.5 9a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1L12 4" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 3v10M3 8h10" /></svg>,
  pin: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" /><path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" /></svg>,
  cal: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>,
  user: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" /></svg>,
  close: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l10 10M13 3L3 13" /></svg>,
  alert: <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6.5" /><path d="M8 5v3.5M8 11h.01" strokeLinecap="round" /></svg>,
  image: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2" /><circle cx="5.5" cy="5.5" r="1" /><path d="M2 10.5l3.5-3.5 2.5 2.5 1.5-1.5 3 3" /></svg>,
  // Dashboard icon — 2×2 grid of squares
  dashboard: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  ),
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ open, event, onClose, onSave, isDark }) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [bannerPreview, setBannerPreview] = useState('')

  useEffect(() => {
    if (!event) return
    const f = {
      title: event.title ?? '',
      artist: event.artist ?? '',
      venue_name: event.venue_name ?? '',
      venue_address: event.venue_address ?? '',
      event_date: event.event_date?.slice(0, 16) ?? '',
      sale_start: event.sale_start?.slice(0, 16) ?? '',
      sale_end: event.sale_end?.slice(0, 16) ?? '',
      banner_url: event.banner_url ?? '',
      status: event.status ?? 'draft',
      queue_enabled: Boolean(event.queue_enabled),
      description: event.description ?? '',
    }
    setForm(f)
    setBannerPreview(f.banner_url)
    setError('')
  }, [event])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    const newVal = type === 'checkbox' ? checked : value
    setForm(p => ({ ...p, [name]: newVal }))
    if (name === 'banner_url') setBannerPreview(value.trim())
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Tên sự kiện không được để trống.'); return }
    setSaving(true)
    try {
      await onSave(event.id, {
        ...form,
        title: form.title.trim(),
        event_date: form.event_date || undefined,
        sale_start: form.sale_start || undefined,
        sale_end: form.sale_end || undefined,
        banner_url: form.banner_url.trim() || undefined,
        description: form.description.trim() || undefined,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls = isDark
    ? 'w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder-slate-500 focus:border-sky-400/60 focus:bg-slate-800 focus:ring-2 focus:ring-sky-400/15'
    : 'w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-sky-400/70 focus:bg-white focus:ring-2 focus:ring-sky-400/15'
  const labelCls = `mb-1.5 block text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,14,26,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`ae-scale-in flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>

        {/* Header */}
        <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
          <div>
            <h2 className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Chỉnh sửa sự kiện</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event?.title}</p>
          </div>
          <button onClick={onClose} className={`flex h-8 w-8 items-center justify-center rounded-full transition ${isDark ? 'text-slate-400 hover:bg-white/10' : 'text-slate-400 hover:bg-slate-100'}`}>
            {Icon.close}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6">
          {error && (
            <div className={`mb-4 flex items-start gap-2.5 rounded-xl border p-3 text-sm ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {Icon.alert}<span>{error}</span>
            </div>
          )}

          <p className={`mb-3 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Thông tin chính</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelCls}>Tên sự kiện *</label>
              <input name="title" value={form.title} onChange={handleChange} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>Nghệ sĩ</label>
              <input name="artist" value={form.artist} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Trạng thái</label>
              <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Địa điểm</label>
              <input name="venue_name" value={form.venue_name} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Địa chỉ</label>
              <input name="venue_address" value={form.venue_address} onChange={handleChange} className={inputCls} />
            </div>

            {/* Banner URL + preview */}
            <div className="md:col-span-2">
              <label className={labelCls}>Banner URL</label>
              <input
                name="banner_url"
                value={form.banner_url}
                onChange={handleChange}
                placeholder="https://..."
                className={inputCls}
              />
              {/* Preview */}
              {bannerPreview ? (
                <div className={`mt-2.5 overflow-hidden rounded-xl border ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                  <div className="relative h-36 w-full">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="h-full w-full object-cover"
                      onError={() => setBannerPreview('')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    <span className="absolute bottom-2 left-3 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm">
                      Xem trước banner
                    </span>
                  </div>
                </div>
              ) : form.banner_url.trim() ? (
                // URL nhập nhưng ảnh lỗi
                <div className={`mt-2.5 flex items-center gap-2 rounded-xl border px-3 py-2.5 text-xs ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-600'}`}>
                  {Icon.image} Không thể tải ảnh từ URL này
                </div>
              ) : (
                <div className={`mt-2.5 flex items-center gap-2 rounded-xl border border-dashed px-3 py-3 text-xs ${isDark ? 'border-slate-700 text-slate-600' : 'border-slate-300 text-slate-400'}`}>
                  {Icon.image} Nhập URL để xem trước banner
                </div>
              )}
            </div>
          </div>

          <p className={`mb-3 mt-6 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Lịch trình</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div><label className={labelCls}>Ngày diễn</label><input type="datetime-local" name="event_date" value={form.event_date} onChange={handleChange} className={inputCls} /></div>
            <div><label className={labelCls}>Mở bán</label><input type="datetime-local" name="sale_start" value={form.sale_start} onChange={handleChange} className={inputCls} /></div>
            <div><label className={labelCls}>Đóng bán</label><input type="datetime-local" name="sale_end" value={form.sale_end} onChange={handleChange} className={inputCls} /></div>
          </div>

          <p className={`mb-3 mt-6 text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Bổ sung</p>
          <div className="space-y-4">
            <div>
              <label className={labelCls}>Mô tả</label>
              <textarea name="description" rows={4} value={form.description} onChange={handleChange} className={`${inputCls} resize-y`} />
            </div>
            <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm transition ${isDark ? 'border-white/10 bg-slate-800/40 hover:bg-slate-800' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'}`}>
              <input type="checkbox" name="queue_enabled" checked={form.queue_enabled} onChange={handleChange} className="h-4 w-4 rounded accent-sky-500" />
              <span>
                <span className="font-semibold">Bật phòng chờ ảo</span>
                <span className={`ml-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cho sự kiện hot có nhu cầu mua đột biến</span>
              </span>
            </label>
          </div>
        </form>

        {/* Footer */}
        <div className={`flex justify-end gap-2 border-t px-6 py-4 ${isDark ? 'border-white/10 bg-slate-900/80' : 'border-slate-100 bg-slate-50/50'}`}>
          <button type="button" onClick={onClose} className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-white'}`}>
            Hủy
          </button>
          <button type="submit" disabled={saving} onClick={handleSubmit}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
            {saving ? <><div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />Đang lưu…</> : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Confirm Delete ───────────────────────────────────────────────────────────
function ConfirmDelete({ open, event, onCancel, onConfirm, isDark }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,14,26,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className={`ae-scale-in w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
        <div className="px-6 py-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            {Icon.trash}
          </div>
          <h3 className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>Xóa sự kiện?</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Bạn sắp xóa <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{event?.title}</span>. Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan.
          </p>
        </div>
        <div className={`flex gap-2 border-t px-6 py-4 ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <button onClick={onCancel} className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-white'}`}>
            Hủy
          </button>
          <button onClick={onConfirm} className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/25 transition hover:opacity-90 active:scale-[0.98]">
            Xóa vĩnh viễn
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, onEdit, onDelete, isDark, delay }) {
  const cfg = STATUS_CFG[event.status] || STATUS_CFG.draft
  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null

  return (
    <article
      className={`ae-fade-up group overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-black/40' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-200/60'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Banner */}
      <div className={`relative h-32 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        {event.banner_url ? (
          <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className={`text-4xl ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>🎫</div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <span className={`absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold backdrop-blur-md ${isDark ? cfg.dCls : cfg.cls}`}>
          {cfg.label}
        </span>
        {event.queue_enabled && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-amber-950 backdrop-blur-md">
            ⚡ Phòng chờ
          </span>
        )}
      </div>

      <div className="p-4">
        <h3 className={`line-clamp-1 text-sm font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{event.title}</h3>
        {event.artist && (
          <p className={`mt-0.5 line-clamp-1 flex items-center gap-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {Icon.user} {event.artist}
          </p>
        )}
        <div className={`mt-3 space-y-1 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {formattedDate && <div className="flex items-center gap-1.5">{Icon.cal}<span>{formattedDate}</span></div>}
          {event.venue_name && <div className="flex items-center gap-1.5">{Icon.pin}<span className="line-clamp-1">{event.venue_name}</span></div>}
        </div>
        <div className={`mt-4 flex gap-2 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <button onClick={() => onEdit(event)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}>
            {Icon.edit} Sửa
          </button>
          <button onClick={() => onDelete(event)}
            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${isDark ? 'border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10' : 'border-rose-200 bg-rose-50/40 text-rose-600 hover:bg-rose-50'}`}>
            {Icon.trash}
          </button>
        </div>
      </div>
    </article>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function AdminEvents() {
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editEvent, setEditEvent] = useState(null)
  const [deleteEvent, setDeleteEvent] = useState(null)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') navigate('/', { replace: true })
  }, [user, authLoading, navigate])

  const loadEvents = () =>
    adminApi.events.list()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

  useEffect(() => { loadEvents() }, [])

  const handleSave = async (id, payload) => {
    await adminApi.events.update(id, payload)
    await loadEvents()
    setEditEvent(null)
  }

  const handleDelete = async () => {
    if (!deleteEvent) return
    try {
      await adminApi.events.delete(deleteEvent.id)
      setEvents(prev => prev.filter(e => e.id !== deleteEvent.id))
      setDeleteEvent(null)
    } catch (err) {
      setError(err.message)
      setDeleteEvent(null)
    }
  }

  const stats = useMemo(() => {
    return events.reduce((acc, e) => {
      acc[e.status] = (acc[e.status] || 0) + 1
      acc.total += 1
      return acc
    }, { total: 0 })
  }, [events])

  const filtered = useMemo(() => {
    let r = events
    if (filter !== 'all') r = r.filter(e => e.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(e =>
        e.title?.toLowerCase().includes(q) ||
        e.artist?.toLowerCase().includes(q) ||
        e.venue_name?.toLowerCase().includes(q)
      )
    }
    return r
  }, [events, filter, search])

  const bg = isDark ? 'bg-slate-950' : 'bg-[#f4f5f9]'
  const text = isDark ? 'text-slate-50' : 'text-slate-900'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const subtle = isDark ? 'text-slate-500' : 'text-slate-400'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'

  return (
    <>
      <style>{CSS}</style>
      <div className={`min-h-screen ${bg} ${text}`}>

        {/* ── Hero banner ── */}
        <div className="ae-hero-bg relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '36px 36px',
              maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at top, black 0%, transparent 70%)',
            }}
          />
          <div className="relative mx-auto max-w-7xl px-6 py-10 md:px-8 md:py-12">
            <div className="ae-fade-up flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">Admin · Quản lý</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white md:text-4xl"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Quản lý sự kiện
                </h1>
                <p className="mt-1 text-sm text-white/70">Tạo mới, chỉnh sửa và quản lý toàn bộ sự kiện trên hệ thống.</p>
              </div>
              <div className="flex gap-2">
                {/* Nút Dashboard với icon, bỏ dấu mũi tên */}
                <Link to="/admin"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/20">
                  {Icon.dashboard}
                  Dashboard
                </Link>
                <Link to="/admin/events/create"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-600 shadow-lg transition hover:-translate-y-0.5">
                  {Icon.plus} Tạo sự kiện
                </Link>
              </div>
            </div>
          </div>
          <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b ${isDark ? 'from-transparent to-slate-950' : 'from-transparent to-[#f4f5f9]'}`} />
        </div>

        <section className="mx-auto max-w-7xl px-6 pb-12 md:px-8">

          {error && (
            <div className={`mb-4 flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {Icon.alert} <span>{error}</span>
            </div>
          )}

          {/* ── Stats strip — thay "Nháp" bằng "Hết vé" ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Tổng sự kiện', value: stats.total || 0, color: 'sky' },
              { label: 'Đang bán', value: stats.on_sale || 0, color: 'emerald' },
              { label: 'Hết vé', value: stats.sold_out || 0, color: 'rose' },
              { label: 'Đã kết thúc', value: stats.finished || 0, color: 'slate' },
            ].map((s, i) => {
              const colorMap = {
                sky: isDark ? 'text-sky-400 bg-sky-500/15' : 'text-sky-600 bg-sky-50',
                emerald: isDark ? 'text-emerald-400 bg-emerald-500/15' : 'text-emerald-600 bg-emerald-50',
                rose: isDark ? 'text-rose-400 bg-rose-500/15' : 'text-rose-600 bg-rose-50',
                slate: isDark ? 'text-slate-400 bg-slate-500/15' : 'text-slate-600 bg-slate-100',
              }
              return (
                <div key={s.label}
                  className={`ae-fade-up rounded-2xl border p-4 ${card}`}
                  style={{ animationDelay: `${i * 60}ms` }}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-bold uppercase tracking-widest ${subtle}`}>{s.label}</p>
                    <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-extrabold ${colorMap[s.color]}`}>
                      {s.value}
                    </div>
                  </div>
                  <p className={`mt-2 text-3xl font-extrabold tabular-nums ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{s.value}</p>
                </div>
              )
            })}
          </div>

          {/* ── Toolbar ── */}
          <div className={`ae-fade-up mt-6 rounded-2xl border p-3 ${card}`}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${subtle}`}>{Icon.search}</span>
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên, nghệ sĩ, địa điểm..."
                  className={`w-full rounded-xl border py-2 pl-9 pr-3 text-sm outline-none transition ${isDark
                    ? 'border-slate-800 bg-slate-800/40 text-white placeholder-slate-500 focus:border-sky-400/60 focus:bg-slate-800'
                    : 'border-slate-200 bg-slate-50/60 text-slate-900 placeholder-slate-400 focus:border-sky-400/70 focus:bg-white'
                    }`}
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_FILTERS.map(f => {
                  const active = filter === f.value
                  const count = f.value === 'all' ? stats.total : (stats[f.value] || 0)
                  return (
                    <button key={f.value} onClick={() => setFilter(f.value)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${active
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/25'
                        : isDark ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}>
                      {f.label}
                      <span className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? 'bg-white/25' : isDark ? 'bg-slate-700' : 'bg-white'}`}>
                        {count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Cards grid ── */}
          <div className="mt-6">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`h-72 animate-pulse rounded-2xl ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className={`flex flex-col items-center justify-center rounded-2xl border py-20 ${card}`}>
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <span className="text-3xl opacity-40">🎫</span>
                </div>
                <p className={`text-base font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {search || filter !== 'all' ? 'Không tìm thấy sự kiện phù hợp' : 'Chưa có sự kiện nào'}
                </p>
                <p className={`mt-1 text-sm ${muted}`}>
                  {search || filter !== 'all' ? 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.' : 'Tạo sự kiện đầu tiên để bắt đầu.'}
                </p>
                {!search && filter === 'all' && (
                  <Link to="/admin/events/create" className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:opacity-90">
                    {Icon.plus} Tạo sự kiện đầu tiên
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((ev, i) => (
                  <EventCard key={ev.id} event={ev} onEdit={setEditEvent} onDelete={setDeleteEvent} isDark={isDark} delay={i * 50} />
                ))}
              </div>
            )}
          </div>
        </section>

        <EditModal open={!!editEvent} event={editEvent} onClose={() => setEditEvent(null)} onSave={handleSave} isDark={isDark} />
        <ConfirmDelete open={!!deleteEvent} event={deleteEvent} onCancel={() => setDeleteEvent(null)} onConfirm={handleDelete} isDark={isDark} />
      </div>
    </>
  )
}

export default AdminEvents