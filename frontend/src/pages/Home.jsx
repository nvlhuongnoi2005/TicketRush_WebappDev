import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import Banner from '../components/Banner.jsx'
import { eventsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { EventCard, SkeletonCard } from '../components/EventCard.jsx'

// ─── Constants ─────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả' },
  { value: 'on_sale', label: 'Đang bán' },
  { value: 'sold_out', label: 'Hết vé' },
  { value: 'finished', label: 'Đã kết thúc' },
  { value: 'cancelled', label: 'Đã hủy' },
]

const STATUS_STYLE = {
  on_sale: { dot: 'bg-emerald-400', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400' },
  sold_out: { dot: 'bg-rose-400', badge: 'border-rose-400/25 bg-rose-400/10 text-rose-400' },
  finished: { dot: 'bg-slate-400', badge: 'border-slate-400/25 bg-slate-400/10 text-slate-400' },
  cancelled: { dot: 'bg-orange-400', badge: 'border-orange-400/25 bg-orange-400/10 text-orange-400' },
}

const STATUS_LABEL = {
  on_sale: 'Đang bán', sold_out: 'Hết vé', finished: 'Đã kết thúc', cancelled: 'Đã hủy',
}

// // ─── Skeleton card ─────────────────────────────────────────────────────────────
// function SkeletonCard({ isDark }) {
//   return (
//     <div className={`overflow-hidden rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
//       <div className={`h-52 animate-pulse ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
//       <div className="space-y-3 p-5">
//         <div className={`h-4 w-3/4 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
//         <div className={`h-3 w-1/2 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
//         <div className={`h-3 w-2/3 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
//         <div className={`h-8 w-28 animate-pulse rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
//       </div>
//     </div>
//   )
// }

// // ─── SVG icons (inline, no emoji) ─────────────────────────────────────────────
// function IconCalendar() {
//   return (
//     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 opacity-50">
//       <rect x="2" y="3" width="12" height="11" rx="2" />
//       <path d="M5 2v2M11 2v2M2 7h12" />
//     </svg>
//   )
// }
// function IconPin() {
//   return (
//     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 opacity-50">
//       <path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" />
//       <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" />
//     </svg>
//   )
// }
// function IconSeat() {
//   return (
//     <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" className="shrink-0 opacity-50">
//       <path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" />
//     </svg>
//   )
// }
// function IconSeatBtn() {
//   return (
//     <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
//       <path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" />
//     </svg>
//   )
// }

// // ─── Event card ────────────────────────────────────────────────────────────────
// function EventCard({ event, isDark }) {
//   const style = STATUS_STYLE[event.status] ?? STATUS_STYLE.finished
//   const isOnSale = event.status === 'on_sale'
//   const isSoldOut = event.status === 'sold_out'
//   const lowStock = isOnSale && event.available_seats != null && event.available_seats < 50

//   const formattedDate = event.event_date
//     ? new Date(event.event_date).toLocaleString('vi-VN', {
//       weekday: 'short', day: '2-digit', month: 'short',
//       year: 'numeric', hour: '2-digit', minute: '2-digit',
//     })
//     : null

//   return (
//     <article
//       className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${isDark
//         ? 'border-slate-800 bg-slate-900 hover:border-slate-700 hover:shadow-xl hover:shadow-black/40'
//         : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/70'
//         }`}
//     >
//       {/* ── Thumbnail ── */}
//       <div className="relative h-48 overflow-hidden">
//         {event.banner_url ? (
//           <img
//             src={event.banner_url}
//             alt={event.title}
//             className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isSoldOut ? 'grayscale-[40%]' : ''
//               }`}
//           />
//         ) : (
//           <div className={`flex h-full items-center justify-center ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
//             <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-20">
//               <path d="M20 4L36 14v16L20 38 4 30V14Z" />
//               <circle cx="20" cy="20" r="5" />
//             </svg>
//           </div>
//         )}

//         {/* gradient overlay */}
//         <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/8 to-transparent" />

//         {/* status badge */}
//         <div className="absolute left-2.5 top-2.5">
//           <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${style.badge}`}>
//             <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
//             {style.label}
//           </span>
//         </div>

//         {/* price chip */}
//         {event.min_price && (
//           <div className="absolute bottom-2.5 right-2.5 rounded-xl border border-white/15 bg-black/52 px-2.5 py-1.5 text-right backdrop-blur-sm">
//             <p className="text-[10px] leading-none text-white/55">Từ</p>
//             <p className="mt-0.5 text-[13px] font-semibold leading-none text-white">
//               {Number(event.min_price).toLocaleString('vi-VN')} ₫
//             </p>
//           </div>
//         )}

//         {/* low stock alert */}
//         {lowStock && (
//           <div className="absolute bottom-2.5 left-2.5 rounded-full border border-rose-400/30 bg-rose-500/15 px-2.5 py-1 backdrop-blur-sm">
//             <span className="text-[11px] font-medium text-rose-400">
//               Chỉ còn {event.available_seats} ghế!
//             </span>
//           </div>
//         )}
//       </div>

//       {/* ── Body ── */}
//       <div className="flex flex-1 flex-col gap-3 p-4">

//         {/* title + artist */}
//         <div>
//           <h3 className={`line-clamp-2 text-[14px] font-semibold leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
//             {event.title}
//           </h3>
//           {event.artist && (
//             <p className={`mt-1 text-xs ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{event.artist}</p>
//           )}
//         </div>

//         {/* meta rows */}
//         <div className={`space-y-1.5 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
//           {formattedDate && (
//             <div className="flex items-center gap-1.5">
//               <IconCalendar />
//               <span className="line-clamp-1">{formattedDate}</span>
//             </div>
//           )}
//           {event.venue_name && (
//             <div className="flex items-center gap-1.5">
//               <IconPin />
//               <span className="line-clamp-1">{event.venue_name}</span>
//             </div>
//           )}
//           {!lowStock && event.available_seats != null && isOnSale && (
//             <div className="flex items-center gap-1.5">
//               <IconSeat />
//               <span>{Number(event.available_seats).toLocaleString('vi-VN')} ghế trống</span>
//             </div>
//           )}
//           {isSoldOut && (
//             <div className="flex items-center gap-1.5">
//               <IconSeat />
//               <span className={isDark ? 'text-rose-400' : 'text-rose-500'}>Đã hết vé</span>
//             </div>
//           )}
//         </div>

//         {/* divider */}
//         <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />

//         {/* CTAs */}
//         <div className="mt-auto flex items-center gap-2">
//           <Link
//             to={`/events/${event.id}`}
//             className={`flex-1 rounded-xl py-2 text-center text-xs font-semibold transition hover:opacity-88 ${isOnSale
//               ? 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20'
//               : isDark
//                 ? 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
//                 : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
//               }`}
//           >
//             Xem chi tiết
//           </Link>
//           {isOnSale && (
//             <Link
//               to={`/seat-map/${event.id}`}
//               className={`flex items-center justify-center rounded-xl p-2 transition ${isDark
//                 ? 'border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
//                 : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
//                 }`}
//               title="Chọn ghế"
//             >
//               <IconSeatBtn />
//             </Link>
//           )}
//         </div>
//       </div>
//     </article>
//   )
// }

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
        <span className={`rounded-full px-1.5 py-0.5 text-xs ${active ? 'bg-white/20 text-white' : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
          }`}>
          {count}
        </span>
      )}
    </button>
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
  const search = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    if (!user) {
      navigate('/')
    }
  }, [user, navigate])

  useEffect(() => {
    setLoading(true)
    eventsApi.list()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const q = search.toLowerCase()
      const matchesSearch = !q || [ev.title, ev.artist, ev.venue_name].some(f => f?.toLowerCase().includes(q))
      const matchesStatus = status === 'all' || ev.status === status
      return matchesSearch && matchesStatus
    })
  }, [events, search, status])

  // count per status for pill badges
  const countByStatus = useMemo(() => {
    const map = { all: events.length }
    events.forEach(ev => { map[ev.status] = (map[ev.status] ?? 0) + 1 })
    return map
  }, [events])

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const divider = isDark ? 'border-slate-800' : 'border-slate-200'

  return (
    <div className={bg}>
      <Banner />

      {/* ── Hero intro ── */}
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className={`relative overflow-hidden rounded-2xl border p-6 md:p-8 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          {/* background accent */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-sky-500/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-indigo-500/8 blur-3xl" />

          <div className="relative grid gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${isDark ? 'border-sky-800 bg-sky-950/80 text-sky-400' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-500" />
                Nền tảng đặt vé trực tuyến
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

            {/* stats */}
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

          {/* admin panel */}
          {user?.role === 'admin' && (
            <div className={`relative mt-5 rounded-xl border p-4 ${isDark ? 'border-emerald-900/60 bg-emerald-950/50' : 'border-emerald-200 bg-emerald-50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    ✦ Admin session
                  </p>
                  <p className={`mt-0.5 text-xs ${isDark ? 'text-emerald-600' : 'text-emerald-600'}`}>
                    Bạn đang đăng nhập với quyền quản trị viên
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to="/admin"
                    className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-500/25 transition hover:bg-emerald-400"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/admin/events/create"
                    className={`rounded-lg border px-4 py-2 text-xs font-semibold transition ${isDark ? 'border-emerald-800 text-emerald-400 hover:bg-emerald-900/40' : 'border-emerald-300 text-emerald-700 hover:bg-emerald-100'}`}
                  >
                    + Tạo sự kiện
                  </Link>
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
            </p>
          </div>

          {/* filter pills */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map(({ value, label }) => (
              <FilterPill
                key={value}
                value={value}
                label={label}
                active={status === value}
                count={countByStatus[value] ?? 0}
                isDark={isDark}
                onClick={setStatus}
              />
            ))}
          </div>
        </div>

        {/* grid */}
        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} isDark={isDark} />)}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className={`flex flex-col items-center justify-center rounded-2xl border py-20 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <span className="text-5xl">🎭</span>
            <p className={`mt-4 text-base font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Không tìm thấy sự kiện nào</p>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            <button
              type="button"
              onClick={() => setStatus('all')}
              className="mt-5 rounded-full bg-sky-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Xem tất cả
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} isDark={isDark} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home