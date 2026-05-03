import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Banner from '../components/Banner.jsx'
import { eventsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { EventCard, SkeletonCard } from '../components/EventCard.jsx'

// ─── Animations ───────────────────────────────────────────────────────────────
const CSS = `
@keyframes hmFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.hm-fade-up { animation: hmFadeUp 0.5s cubic-bezier(.22,1,.36,1) both; }
`

// ─── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 9

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'on_sale', label: 'Đang bán' },
  { value: 'sold_out', label: 'Hết vé' },
  { value: 'finished', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' },
]

// ─── Filter pill ───────────────────────────────────────────────────────────────
function FilterPill({ value, label, active, count, isDark, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-200 cursor-pointer ${active
        ? 'border-sky-500 bg-sky-500 text-white shadow-md shadow-sky-500/20'
        : isDark
          ? 'border-slate-700 bg-slate-800/80 text-slate-400 hover:border-slate-600 hover:text-slate-200'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
        }`}
    >
      {label}
      {count != null && (
        <span className={`rounded-full px-1.5 py-0.5 text-xs ${active
          ? 'bg-white/20 text-white'
          : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
          {count}
        </span>
      )}
    </button>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function IconChevron({ dir = 'right' }) {
  const d = dir === 'left' ? 'M10 4l-4 4 4 4' : 'M6 4l4 4-4 4'
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

function Pagination({ page, totalPages, onChange, isDark }) {
  if (totalPages <= 1) return null

  const buildPages = () => {
    const pages = []
    const win = 1
    const showLeft = page > win + 2
    const showRight = page < totalPages - win - 1
    pages.push(1)
    if (showLeft) pages.push('…')
    const start = Math.max(2, page - win)
    const end = Math.min(totalPages - 1, page + win)
    for (let i = start; i <= end; i++) pages.push(i)
    if (showRight) pages.push('…')
    if (totalPages > 1) pages.push(totalPages)
    return [...new Set(pages)]
  }

  const pages = buildPages()
  const btnBase = `inline-flex h-9 min-w-[36px] items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0`
  const btnInactive = isDark
    ? 'border-slate-700 bg-slate-800/60 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50'
  const btnActive = 'border-sky-500 bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/30'

  return (
    <nav className="hm-fade-up mt-8 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1}
        className={`flex items-center justify-center p-1 transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        aria-label="Trang trước">
        <IconChevron dir="left" />
      </button>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ell-${i}`} className={`px-1.5 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>…</span>
        ) : (
          <button key={p} type="button" onClick={() => onChange(p)}
            className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
            aria-label={`Trang ${p}`} aria-current={p === page ? 'page' : undefined}>
            {p}
          </button>
        )
      )}

      <button type="button" onClick={() => onChange(page + 1)} disabled={page === totalPages}
        className={`flex items-center justify-center p-1 transition hover:scale-110 disabled:opacity-30 disabled:hover:scale-100 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        aria-label="Trang sau">
        <IconChevron dir="right" />
      </button>
    </nav>
  )
}

// ─── AnimatedEventCard wrapper — re-triggers animation on page change ─────────
function AnimatedCard({ event, isDark, index, pageKey }) {
  return (
    <div
      className="hm-fade-up"
      key={`${event.id}-${pageKey}`}
      style={{ animationDelay: `${Math.min(index * 50, 400)}ms` }}
    >
      <EventCard event={event} isDark={isDark} />
    </div>
  )
}

// ─── Home ──────────────────────────────────────────────────────────────────────
function Home() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [status, setStatus] = useState('all')
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const search = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    if (!user) navigate('/')
  }, [user, navigate])

  useEffect(() => {
    setLoading(true)
    eventsApi.list()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  // Reset page on filter/search change
  useEffect(() => { setPage(1) }, [status, search])

  const filteredEvents = useMemo(() => {
    return events.filter(ev => {
      const q = search.toLowerCase()
      const matchSearch = !q || [ev.title, ev.artist, ev.venue_name].some(f => f?.toLowerCase().includes(q))
      const matchStatus = status === 'all' || ev.status === status
      return matchSearch && matchStatus
    })
  }, [events, search, status])

  const countByStatus = useMemo(() => {
    const map = { all: events.length }
    events.forEach(ev => { map[ev.status] = (map[ev.status] ?? 0) + 1 })
    return map
  }, [events])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE
    return filteredEvents.slice(start, start + PAGE_SIZE)
  }, [filteredEvents, safePage])

  const handlePageChange = (p) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
    document.getElementById('events-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const divider = isDark ? 'border-slate-800' : 'border-slate-200'

  return (
    <>
      <style>{CSS}</style>
      <div className={bg}>
        <Banner />

        {/* ── Hero intro ── */}
        <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/8 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />

            <div className="relative grid gap-6 md:grid-cols-[1fr_auto]">
              <div>
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${isDark ? 'border-sky-800 bg-sky-950/80 text-sky-400' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                  Nền tảng đặt vé #1 Việt Nam
                </span>
                <h1 className={`mt-3 max-w-2xl text-3xl font-bold leading-tight tracking-tight md:text-4xl ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                  Đặt vé sự kiện{' '}
                  <span className="bg-gradient-to-r from-sky-500 to-indigo-500 bg-clip-text text-transparent">
                    nhanh chóng &amp; dễ dàng
                  </span>
                </h1>
                <p className={`mt-3 max-w-xl text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Concerts, lễ hội, hội nghị - tìm kiếm sự kiện, chọn chỗ ngồi trực quan và nhận vé QR ngay sau khi thanh toán.
                </p>
              </div>

              <div className={`flex shrink-0 flex-col justify-center gap-4 border-l pl-6 md:pl-8 ${divider}`}>
                {[
                  { value: events.length, label: 'Sự kiện' },
                  { value: countByStatus.on_sale ?? 0, label: 'Đang mở bán' },
                ].map(({ value, label }) => (
                  <div key={label} className="text-right">
                    <p className={`text-3xl font-extrabold tabular-nums ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
                    <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {user?.role === 'admin' && (
              <div className={`relative mt-5 rounded-xl border p-4 ${isDark ? 'border-emerald-900/60 bg-emerald-950/50' : 'border-emerald-200 bg-emerald-50'}`}>
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>✦ Admin session</p>
                    <p className={`mt-0.5 text-xs ${isDark ? 'text-emerald-600' : 'text-emerald-600'}`}>Bạn đang đăng nhập với quyền quản trị viên</p>
                  </div>
                  <div className="flex gap-2">
                    <Link to="/admin" className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-400">Dashboard</Link>
                    <Link to="/admin/events/create" className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${isDark ? 'border-emerald-800 text-emerald-400 hover:bg-emerald-900/40' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100'}`}>+ Tạo sự kiện</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Events section ── */}
        <section className="mx-auto max-w-7xl px-6 pb-14 md:px-8">
          {/* toolbar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`text-xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {search ? `Kết quả cho "${search}"` : 'Tất cả sự kiện'}
              </h2>
              <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {filteredEvents.length} sự kiện tìm thấy
                {totalPages > 1 && (
                  <> · Trang <span className="font-semibold tabular-nums">{safePage}</span>/<span className="font-semibold tabular-nums">{totalPages}</span></>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <FilterPill key={value} value={value} label={label} active={status === value}
                  count={countByStatus[value] ?? 0} isDark={isDark} onClick={setStatus} />
              ))}
            </div>
          </div>

          {/* grid */}
          <div id="events-grid">
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className={`flex flex-col items-center justify-center rounded-2xl border py-20 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <span className="text-5xl">🎭</span>
                <p className={`mt-4 text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Không tìm thấy sự kiện nào</p>
                <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <button type="button" onClick={() => setStatus('all')}
                  className="mt-5 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
                  Xem tất cả
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {paged.map((event, i) => (
                    <AnimatedCard key={`${event.id}-${safePage}`} event={event} isDark={isDark} index={i} pageKey={safePage} />
                  ))}
                </div>

                <Pagination page={safePage} totalPages={totalPages} onChange={handlePageChange} isDark={isDark} />

                {totalPages > 1 && (
                  <p className={`mt-3 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Hiển thị <span className="font-semibold tabular-nums">{(safePage - 1) * PAGE_SIZE + 1}</span>
                    {' – '}
                    <span className="font-semibold tabular-nums">{Math.min(safePage * PAGE_SIZE, filteredEvents.length)}</span>
                    {' '}trong <span className="font-semibold tabular-nums">{filteredEvents.length}</span> sự kiện
                  </p>
                )}
              </>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

export default Home