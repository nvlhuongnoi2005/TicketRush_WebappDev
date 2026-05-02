import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  valid: { label: 'Hợp lệ', dot: 'bg-emerald-400', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400' },
  used: { label: 'Đã dùng', dot: 'bg-slate-400', badge: 'border-slate-400/25 bg-slate-400/10 text-slate-400' },
  cancelled: { label: 'Đã hủy', dot: 'bg-rose-400', badge: 'border-rose-400/25 bg-rose-400/10 text-rose-400' },
}

const FILTERS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'valid', label: 'Hợp lệ' },
  { value: 'used', label: 'Đã dùng' },
  { value: 'cancelled', label: 'Đã hủy' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCalendar() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
      <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
      <path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" />
      <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" />
    </svg>
  )
}
function IconSeat() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
      <path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" />
    </svg>
  )
}
function IconTicketEmpty() {
  return (
    <svg width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-25">
      <path d="M4 16a4 4 0 0 0 0 8v6a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2v-6a4 4 0 0 0 0-8v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6Z" />
      <path d="M16 8v24" strokeDasharray="3 3" />
    </svg>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonTicket({ isDark }) {
  const base = isDark ? 'bg-slate-800' : 'bg-slate-100'
  const wrap = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  return (
    <div className={`overflow-hidden rounded-2xl border ${wrap}`}>
      <div className={`h-1 w-full animate-pulse ${base}`} />
      <div className="p-5 space-y-4">
        <div className="flex justify-between">
          <div className={`h-4 w-2/3 animate-pulse rounded-full ${base}`} />
          <div className={`h-5 w-16 animate-pulse rounded-full ${base}`} />
        </div>
        <div className={`h-px w-full ${base}`} />
        <div className="flex gap-4">
          <div className={`h-20 w-20 shrink-0 animate-pulse rounded-xl ${base}`} />
          <div className="flex-1 space-y-2.5">
            <div className={`h-3 w-full animate-pulse rounded-full ${base}`} />
            <div className={`h-3 w-3/4 animate-pulse rounded-full ${base}`} />
            <div className={`h-3 w-1/2 animate-pulse rounded-full ${base}`} />
          </div>
        </div>
        <div className={`h-8 w-28 animate-pulse rounded-xl ${base}`} />
      </div>
    </div>
  )
}

// ─── Ticket card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, isDark }) {
  const cfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.valid
  const dim = ticket.status === 'used' || ticket.status === 'cancelled'

  const formattedDate = ticket.event_date
    ? new Date(ticket.event_date).toLocaleString('vi-VN', {
      weekday: 'short', day: '2-digit', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    : null

  return (
    <article className={`group overflow-hidden rounded-2xl border transition-all duration-300 ${dim ? 'opacity-70' : 'hover:-translate-y-0.5 hover:shadow-xl'
      } ${isDark
        ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-black/40'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-200/60'
      }`}>
      <div className={`h-1 w-full ${ticket.status === 'valid' ? 'bg-gradient-to-r from-sky-500 to-indigo-500' :
        ticket.status === 'cancelled' ? 'bg-rose-400/60' : 'bg-slate-400/40'
        }`} />

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className={`line-clamp-2 text-[15px] font-semibold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              {ticket.event_title}
            </h2>
            {(ticket.seat_label || ticket.section_name) && (
              <p className={`mt-0.5 flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <IconSeat />
                {[ticket.section_name, ticket.seat_label].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>

        {/* Perforation divider */}
        <div className="relative mb-4 flex items-center">
          <div className={`absolute -left-5 h-4 w-4 rounded-full border-r ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
          <div className={`flex-1 border-t border-dashed ${isDark ? 'border-slate-700/70' : 'border-slate-200'}`} />
          <div className={`absolute -right-5 h-4 w-4 rounded-full border-l ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`} />
        </div>

        <div className="flex gap-4">
          {ticket.qr_image_url ? (
            <div className={`shrink-0 rounded-xl p-1.5 ${isDark ? 'bg-white' : 'bg-slate-50 border border-slate-100'}`}>
              <img src={ticket.qr_image_url} alt="QR" className={`h-[72px] w-[72px] rounded-lg object-contain ${dim ? 'grayscale' : ''}`} />
            </div>
          ) : (
            <div className={`flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-20">
                <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h2v2h-2zM18 14v2M14 18h4v2M20 18v2" />
              </svg>
            </div>
          )}

          <div className={`flex flex-1 flex-col justify-center gap-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {formattedDate && (
              <div className="flex items-center gap-1.5"><IconCalendar /><span className="line-clamp-1">{formattedDate}</span></div>
            )}
            {ticket.venue_name && (
              <div className="flex items-center gap-1.5"><IconPin /><span className="line-clamp-1">{ticket.venue_name}</span></div>
            )}
            <p className={`mt-0.5 text-sm font-bold ${ticket.status === 'valid' ? isDark ? 'text-sky-400' : 'text-sky-600' : isDark ? 'text-slate-500' : 'text-slate-400'
              }`}>
              {Number(ticket.price || 0).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        <div className={`mt-4 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <Link
            to={`/tickets/${ticket.id}`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition ${ticket.status === 'valid'
              ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:opacity-90'
              : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
          >
            Xem chi tiết
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M2 6h8M7 3l3 3-3 3" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  )
}

// ─── Filter pill ──────────────────────────────────────────────────────────────
function FilterPill({ value, label, active, count, isDark, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${active
        ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20'
        : isDark
          ? 'border-slate-700 bg-slate-800/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
        }`}
    >
      {label}
      {count != null && (
        <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>{count}</span>
      )}
    </button>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, isDark }) {
  return (
    <div className={`flex flex-col gap-2.5 rounded-2xl border p-4 ${isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-200 bg-white/70'}`}>
      <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <span className={color}>{icon}</span>
        {label}
      </div>
      <p className={`text-xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function Tickets() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }
    setLoading(true)
    ticketsApi.list()
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  const countByFilter = useMemo(() => {
    const map = { all: tickets.length }
    tickets.forEach(t => { const s = t.status || 'valid'; map[s] = (map[s] ?? 0) + 1 })
    return map
  }, [tickets])

  const filtered = useMemo(() => {
    if (filter === 'all') return tickets
    return tickets.filter(t => (t.status || 'valid') === filter)
  }, [tickets, filter])

  const totalSpent = useMemo(() =>
    tickets.reduce((sum, t) => sum + Number(t.price || 0), 0)
    , [tickets])

  const upcomingCount = useMemo(() =>
    tickets.filter(t => t.status === 'valid' && t.event_date && new Date(t.event_date) > new Date()).length
    , [tickets])

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'

  return (
    <div className={`min-h-screen ${bg}`}>

      {/* ── Hero banner ── */}
      <div className={`relative overflow-hidden border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
        {/* Decorative background */}
        <div className="pointer-events-none absolute inset-0">
          <div className={`absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl ${isDark ? 'bg-sky-500/6' : 'bg-sky-400/10'}`} />
          <div className={`absolute -bottom-16 left-1/3 h-48 w-48 rounded-full blur-3xl ${isDark ? 'bg-indigo-500/5' : 'bg-indigo-400/8'}`} />
          <svg className={`absolute inset-0 h-full w-full ${isDark ? 'opacity-[0.025]' : 'opacity-[0.05]'}`} xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="ticket-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#ticket-dots)" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-8 md:px-8">
          <div className="mb-6">
            <div className="mb-1 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-sky-500">
                <path d="M2 8a2 2 0 0 0 0 4v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-4V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v3Z" />
                <path d="M8 4v12" strokeDasharray="2 2" />
              </svg>
              <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                Vé của tôi
              </span>
            </div>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
              Bộ sưu tập vé
            </h1>
          </div>

          {/* Stats grid */}
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`h-[72px] animate-pulse rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatCard label="Tổng vé" value={tickets.length} color={isDark ? 'text-slate-200' : 'text-slate-700'} isDark={isDark}
                icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" /><path d="M7 3v10" strokeDasharray="2 2" /></svg>} />
              <StatCard label="Hợp lệ" value={countByFilter.valid ?? 0} color="text-emerald-400" isDark={isDark}
                icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M5 8l2 2 4-4" /></svg>} />
              <StatCard label="Sắp diễn" value={upcomingCount} color="text-sky-400" isDark={isDark}
                icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>} />
              <StatCard label="Đã chi" value={`${totalSpent.toLocaleString('vi-VN')} ₫`} color={isDark ? 'text-indigo-400' : 'text-indigo-600'} isDark={isDark}
                icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 4.5v1M8 10.5v1M5.5 7h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H10" /></svg>} />
            </div>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">

        {successMsg && (
          <div className={`mb-6 flex items-center justify-between rounded-2xl border p-4 text-sm ${isDark ? 'border-emerald-800/50 bg-emerald-950/60 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}>
            <div className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="8" cy="8" r="6.5" /><path d="M5 8l2.5 2.5L11 5.5" />
              </svg>
              {successMsg}
            </div>
            <button onClick={() => setSuccessMsg('')} className={`ml-4 rounded-lg p-1 transition hover:bg-black/10 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l8 8M10 2l-8 8" /></svg>
            </button>
          </div>
        )}

        {error && (
          <div className={`mb-6 flex items-center gap-2 rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-800/50 bg-rose-950/60 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'
            }`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="8" cy="8" r="6.5" /><path d="M8 5v3.5M8 11v.5" />
            </svg>
            {error}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map(({ value, label }) => (
            <FilterPill key={value} value={value} label={label} active={filter === value} count={countByFilter[value] ?? 0} isDark={isDark} onClick={setFilter} />
          ))}
        </div>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonTicket key={i} isDark={isDark} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className={`flex flex-col items-center justify-center rounded-2xl border py-24 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <IconTicketEmpty />
            </div>
            <p className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {filter === 'all' ? 'Bạn chưa có vé nào' : 'Không có vé nào trong mục này'}
            </p>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {filter === 'all' ? 'Đặt vé sự kiện ngay để bắt đầu.' : 'Thử xem mục khác.'}
            </p>
            {filter === 'all'
              ? <Link to="/home" className="mt-6 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">Khám phá sự kiện</Link>
              : <button type="button" onClick={() => setFilter('all')} className="mt-6 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">Xem tất cả</button>
            }
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(ticket => <TicketCard key={ticket.id} ticket={ticket} isDark={isDark} />)}
          </div>
        )}
      </section>
    </div>
  )
}

export default Tickets