import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// ─── Animations ───────────────────────────────────────────────────────────────
const CSS = `
@keyframes tkFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes tkFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes tkScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes tkPulseDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50%      { transform: scale(1.4); opacity: 0.6; }
}
@keyframes tkShimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.tk-fade-up   { animation: tkFadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
.tk-fade-in   { animation: tkFadeIn 0.4s ease both; }
.tk-scale-in  { animation: tkScaleIn 0.4s cubic-bezier(.22,1,.36,1) both; }
.tk-pulse-dot { animation: tkPulseDot 2s ease infinite; }

.tk-shimmer {
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
  background-size: 200% 100%;
  animation: tkShimmer 2s linear infinite;
}

button:not(:disabled), a, input { cursor: auto; }
button:not(:disabled), a { cursor: pointer; }
input { cursor: text; }
`

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

const PAGE_SIZE = 9

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCalendar() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>
}
function IconPin() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0"><path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" /><path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" /></svg>
}
function IconSeat() {
  return <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0"><path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" /></svg>
}
function IconSearch() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="7" cy="7" r="5" /><path d="m11 11 3 3" strokeLinecap="round" /></svg>
}
function IconClose() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" /></svg>
}
function IconChevron({ dir = 'right' }) {
  const d = dir === 'left' ? 'M10 4l-4 4 4 4' : 'M6 4l4 4-4 4'
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  )
}
function IconTicketEmpty() {
  return <svg width="36" height="36" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-25"><path d="M4 16a4 4 0 0 0 0 8v6a2 2 0 0 0 2 2h28a2 2 0 0 0 2-2v-6a4 4 0 0 0 0-8v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6Z" /><path d="M16 8v24" strokeDasharray="3 3" /></svg>
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonTicket({ isDark }) {
  const base = isDark ? 'bg-slate-800' : 'bg-slate-100'
  const wrap = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  return (
    <div className={`relative overflow-hidden rounded-2xl border ${wrap}`}>
      <div className="tk-shimmer absolute inset-0" />
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

// ─── Highlight matched text ───────────────────────────────────────────────────
function HighlightText({ text = '', query = '', isDark }) {
  if (!query.trim()) return <>{text}</>
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  const parts = text.split(re)
  return (
    <>
      {parts.map((part, i) =>
        re.test(part) ? (
          <mark key={i} className={`rounded px-0.5 ${isDark ? 'bg-sky-500/30 text-sky-300' : 'bg-yellow-200 text-slate-900'}`}>
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  )
}

// ─── Ticket card ──────────────────────────────────────────────────────────────
function TicketCard({ ticket, isDark, query, index }) {
  const cfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.valid
  const dim = ticket.status === 'used' || ticket.status === 'cancelled'

  const formattedDate = ticket.event_date
    ? new Date(ticket.event_date).toLocaleString('vi-VN', {
      weekday: 'short', day: '2-digit', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    : null

  return (
    <article
      className={`tk-fade-up group overflow-hidden rounded-2xl border transition-all duration-300 ${dim ? 'opacity-70' : 'hover:-translate-y-1 hover:shadow-xl'} ${isDark
        ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-black/40'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-200/60'
        }`}
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className={`h-1 w-full ${ticket.status === 'valid' ? 'bg-gradient-to-r from-sky-500 to-indigo-500' :
        ticket.status === 'cancelled' ? 'bg-rose-400/60' : 'bg-slate-400/40'
        }`} />

      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className={`line-clamp-2 text-[15px] font-semibold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              <HighlightText text={ticket.event_title} query={query} isDark={isDark} />
            </h2>
            {(ticket.seat_label || ticket.section_name) && (
              <p className={`mt-0.5 flex items-center gap-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <IconSeat />
                {[ticket.section_name, ticket.seat_label].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
          <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${cfg.badge}`}>
            <span className={`tk-pulse-dot h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
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
            <div className={`shrink-0 rounded-xl p-1.5 transition-transform group-hover:scale-105 ${isDark ? 'bg-white' : 'bg-slate-50 border border-slate-100'}`}>
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
              <div className="flex items-center gap-1.5"><IconPin /><span className="line-clamp-1">
                <HighlightText text={ticket.venue_name} query={query} isDark={isDark} />
              </span></div>
            )}
            <p className={`mt-0.5 text-sm font-bold ${ticket.status === 'valid' ? isDark ? 'text-sky-400' : 'text-sky-600' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {Number(ticket.price || 0).toLocaleString('vi-VN')} ₫
            </p>
          </div>
        </div>

        <div className={`mt-4 border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <Link
            to={`/tickets/${ticket.id}`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-all hover:gap-2.5 ${ticket.status === 'valid'
              ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:opacity-90'
              : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'
              }`}
          >
            Xem chi tiết
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="transition-transform group-hover:translate-x-0.5">
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5 ${active
        ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/30'
        : isDark
          ? 'border-slate-700 bg-slate-800/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
        }`}
    >
      {label}
      {count != null && (
        <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-white/25 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
      )}
    </button>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, color, icon, isDark, delay = 0 }) {
  return (
    <div
      className={`tk-fade-up flex flex-col gap-2.5 rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:shadow-md ${isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-200 bg-white/70'
        }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        <span className={color}>{icon}</span>
        {label}
      </div>
      <p className={`text-xl font-bold tabular-nums leading-none ${color}`}>{value}</p>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, onChange, isDark }) {
  if (totalPages <= 1) return null

  // Build smart page list with ellipsis: 1 … 3 4 [5] 6 7 … 12
  const buildPages = () => {
    const pages = []
    const window = 1 // số trang xung quanh trang hiện tại
    const showLeft = page > window + 2
    const showRight = page < totalPages - window - 1

    pages.push(1)
    if (showLeft) pages.push('…')

    const start = Math.max(2, page - window)
    const end = Math.min(totalPages - 1, page + window)
    for (let i = start; i <= end; i++) pages.push(i)

    if (showRight) pages.push('…')
    if (totalPages > 1) pages.push(totalPages)

    // dedupe (case totalPages nhỏ)
    return [...new Set(pages)]
  }

  const pages = buildPages()

  const btnBase = `inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`
  const btnInactive = isDark
    ? 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
  const btnActive = 'border-sky-500 bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/30'

  return (
    <nav className="tk-fade-up mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`flex items-center justify-center p-1 transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        aria-label="Trang trước"
      >
        <IconChevron dir="left" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className={`px-1.5 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            aria-label={`Trang ${p}`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`flex items-center justify-center p-1 transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
          }`}
        aria-label="Trang sau"
      >
        <IconChevron dir="right" />
      </button>
    </nav>
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
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/', { replace: true }); return }
    setLoading(true)
    ticketsApi.list()
      .then(setTickets)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, authLoading])

  // Debounce search input — chỉ filter sau khi user dừng gõ 250ms
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim().toLowerCase()), 250)
    return () => clearTimeout(t)
  }, [search])

  // Reset về page 1 khi filter/search đổi
  useEffect(() => {
    setPage(1)
  }, [filter, debouncedSearch])

  const countByFilter = useMemo(() => {
    const map = { all: tickets.length }
    tickets.forEach(t => { const s = t.status || 'valid'; map[s] = (map[s] ?? 0) + 1 })
    return map
  }, [tickets])

  // Filter theo status + search
  const filtered = useMemo(() => {
    let list = filter === 'all' ? tickets : tickets.filter(t => (t.status || 'valid') === filter)
    if (debouncedSearch) {
      list = list.filter(t =>
        (t.event_title || '').toLowerCase().includes(debouncedSearch) ||
        (t.venue_name || '').toLowerCase().includes(debouncedSearch) ||
        (t.section_name || '').toLowerCase().includes(debouncedSearch) ||
        (t.seat_label || '').toLowerCase().includes(debouncedSearch)
      )
    }
    return list
  }, [tickets, filter, debouncedSearch])

  // Pagination math
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, safePage])

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    // Smooth scroll up đến đầu danh sách
    document.getElementById('ticket-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const totalSpent = useMemo(() => tickets.reduce((sum, t) => sum + Number(t.price || 0), 0), [tickets])
  const upcomingCount = useMemo(() =>
    tickets.filter(t => t.status === 'valid' && t.event_date && new Date(t.event_date) > new Date()).length
    , [tickets])

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'

  return (
    <>
      <style>{CSS}</style>
      <div className={`min-h-screen ${bg}`}>

        {/* ── Hero banner ── */}
        <div className={`relative overflow-hidden border-b ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
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
            <div className="tk-fade-up mb-6">
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
                <StatCard label="Tổng vé" value={tickets.length} color={isDark ? 'text-slate-200' : 'text-slate-700'} isDark={isDark} delay={0}
                  icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" /><path d="M7 3v10" strokeDasharray="2 2" /></svg>} />
                <StatCard label="Hợp lệ" value={countByFilter.valid ?? 0} color="text-emerald-400" isDark={isDark} delay={60}
                  icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M5 8l2 2 4-4" /></svg>} />
                <StatCard label="Sắp diễn" value={upcomingCount} color="text-sky-400" isDark={isDark} delay={120}
                  icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>} />
                <StatCard label="Đã chi" value={`${totalSpent.toLocaleString('vi-VN')} ₫`} color={isDark ? 'text-indigo-400' : 'text-indigo-600'} isDark={isDark} delay={180}
                  icon={<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6" /><path d="M8 4.5v1M8 10.5v1M5.5 7h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H10" /></svg>} />
              </div>
            )}
          </div>
        </div>

        {/* ── Main content ── */}
        <section className="mx-auto max-w-7xl px-6 py-8 md:px-8">

          {successMsg && (
            <div className={`tk-scale-in mb-6 flex items-center justify-between rounded-2xl border p-4 text-sm ${isDark ? 'border-emerald-800/50 bg-emerald-950/60 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="8" cy="8" r="6.5" /><path d="M5 8l2.5 2.5L11 5.5" />
                </svg>
                {successMsg}
              </div>
              <button onClick={() => setSuccessMsg('')} className={`ml-4 rounded-lg p-1 transition hover:bg-black/10 ${isDark ? 'text-emerald-500' : 'text-emerald-600'}`}>
                <IconClose />
              </button>
            </div>
          )}

          {error && (
            <div className={`tk-scale-in mb-6 flex items-center gap-2 rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-800/50 bg-rose-950/60 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="8" cy="8" r="6.5" /><path d="M8 5v3.5M8 11v.5" />
              </svg>
              {error}
            </div>
          )}

          {/* ── Search + Filter toolbar ── */}
          <div className="tk-fade-up mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search */}
            <div className="relative w-full lg:max-w-md">
              <span className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                <IconSearch />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên sự kiện, địa điểm, khu vực, ghế..."
                className={`w-full rounded-2xl border py-2.5 pl-10 pr-10 text-sm outline-none transition ${isDark
                  ? 'border-slate-700 bg-slate-800/60 text-white placeholder-slate-500 focus:border-sky-400/60 focus:bg-slate-800 focus:ring-2 focus:ring-sky-400/15'
                  : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/15'
                  }`}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 transition ${isDark ? 'text-slate-500 hover:bg-slate-700 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                  aria-label="Xóa tìm kiếm"
                >
                  <IconClose />
                </button>
              )}
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(({ value, label }) => (
                <FilterPill key={value} value={value} label={label} active={filter === value} count={countByFilter[value] ?? 0} isDark={isDark} onClick={setFilter} />
              ))}
            </div>
          </div>

          {totalPages > 1 && (
            <p className={`mb-4 text-left text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              Hiển thị <span className="font-semibold tabular-nums">{(safePage - 1) * PAGE_SIZE + 1}</span>
              {' - '}
              <span className="font-semibold tabular-nums">{Math.min(safePage * PAGE_SIZE, filtered.length)}</span>
              {' '}trong tổng số <span className="font-semibold tabular-nums">{filtered.length}</span> vé
            </p>
          )}

          {/* Result counter */}
          {!loading && (debouncedSearch || filter !== 'all') && (
            <div className={`tk-fade-in mb-4 flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span>
                Tìm thấy <span className="font-bold tabular-nums">{filtered.length}</span> vé
                {debouncedSearch && (
                  <> với từ khóa <span className={`font-semibold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>"{debouncedSearch}"</span></>
                )}
              </span>
              {(debouncedSearch || filter !== 'all') && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setFilter('all') }}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition ${isDark ? 'border-slate-700 hover:border-slate-600 hover:bg-slate-800' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                    }`}
                >
                  <IconClose /> Xóa lọc
                </button>
              )}
            </div>
          )}

          {/* ── Grid ── */}
          <div id="ticket-grid">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonTicket key={i} isDark={isDark} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className={`tk-scale-in flex flex-col items-center justify-center rounded-2xl border py-24 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <IconTicketEmpty />
                </div>
                <p className={`text-base font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {debouncedSearch
                    ? `Không tìm thấy vé nào khớp với "${debouncedSearch}"`
                    : filter === 'all' ? 'Bạn chưa có vé nào' : 'Không có vé nào trong mục này'}
                </p>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {debouncedSearch
                    ? 'Thử từ khóa khác hoặc xóa bộ lọc.'
                    : filter === 'all' ? 'Đặt vé sự kiện ngay để bắt đầu.' : 'Thử xem mục khác.'}
                </p>
                {debouncedSearch || filter !== 'all'
                  ? <button type="button" onClick={() => { setSearch(''); setFilter('all') }}
                    className="mt-6 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 hover:-translate-y-0.5">
                    Xem tất cả vé
                  </button>
                  : <Link to="/home"
                    className="mt-6 rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400 hover:-translate-y-0.5">
                    Khám phá sự kiện
                  </Link>
                }
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {paged.map((ticket, i) => (
                    <TicketCard
                      key={`${ticket.id}-${safePage}`}  // re-trigger animation khi đổi page
                      ticket={ticket}
                      isDark={isDark}
                      query={debouncedSearch}
                      index={i}
                    />
                  ))}
                </div>

                {/* Pagination */}
                <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} isDark={isDark} />

                {/* Page info */}
                {/* {totalPages > 1 && (
                  <p className={`mt-3 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Hiển thị <span className="font-semibold tabular-nums">{(safePage - 1) * PAGE_SIZE + 1}</span>
                    {' - '}
                    <span className="font-semibold tabular-nums">{Math.min(safePage * PAGE_SIZE, filtered.length)}</span>
                    {' '}trong tổng số <span className="font-semibold tabular-nums">{filtered.length}</span> vé
                  </p>
                )} */}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

export default Tickets