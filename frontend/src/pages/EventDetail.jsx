import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventsApi } from '../lib/api'
import { useTheme } from '../context/ThemeContext.jsx'

const DESC_LIMIT = 260

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  on_sale: { label: 'Đang mở bán', cls: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-400', dot: 'bg-emerald-400 animate-pulse' },
  sold_out: { label: 'Hết vé', cls: 'border-rose-400/30 bg-rose-400/10 text-rose-400', dot: 'bg-rose-400' },
  finished: { label: 'Đã kết thúc', cls: 'border-slate-400/30 bg-slate-400/10 text-slate-400', dot: 'bg-slate-400' },
  cancelled: { label: 'Đã hủy', cls: 'border-orange-400/30 bg-orange-400/10 text-orange-400', dot: 'bg-orange-400' },
}

// ─── Inline styles for CSS animations (no external deps) ─────────────────────
const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
.anim-fade-up   { animation: fadeUp  0.55s cubic-bezier(.22,1,.36,1) both; }
.anim-fade-in   { animation: fadeIn  0.4s ease both; }
.anim-scale-in  { animation: scaleIn 0.5s cubic-bezier(.22,1,.36,1) both; }
.delay-100 { animation-delay: 0.1s; }
.delay-200 { animation-delay: 0.2s; }
.delay-300 { animation-delay: 0.3s; }
.delay-400 { animation-delay: 0.4s; }
.delay-500 { animation-delay: 0.5s; }
.delay-600 { animation-delay: 0.6s; }
`

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCal() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>
}
function IconPin() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60"><path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" /><path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" /></svg>
}
function IconSeat() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60"><path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" /></svg>
}
function IconArrow() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M2 7h10M8 4l3 3-3 3" /></svg>
}
function IconBack() {
  return <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10 3L5 8l5 5" /></svg>
}
function IconChevron({ up }) {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-transform duration-200 ${up ? 'rotate-180' : ''}`}><path d="M2 4.5l5 5 5-5" /></svg>
}
function IconClock() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60"><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5l2.5 1.5" /></svg>
}
function IconQueue() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="5" cy="4.5" r="1.5" />
      <circle cx="11" cy="4.5" r="1.5" />
      <path d="M3.5 8c.5-1 1.5-1.5 3-1.5S9 7 9.5 8M8.5 8c.5-1 1.5-1.5 3-1.5" />
      <path d="M4 12h8" />
    </svg>
  )
}
function IconTicket() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M2.5 5.5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v1a1.5 1.5 0 0 0 0 3v1a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-1a1.5 1.5 0 0 0 0-3v-1Z" />
      <path d="M8 4.5v7" strokeDasharray="1.5 1.5" />
    </svg>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ isDark }) {
  const p = isDark ? 'bg-slate-800' : 'bg-slate-200'
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <div className={`h-[55vh] w-full animate-pulse ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`} />
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-4">
            <div className={`h-6 w-32 animate-pulse rounded-full ${p}`} />
            <div className={`h-10 w-3/4 animate-pulse rounded-2xl ${p}`} />
            <div className={`h-4 w-1/3 animate-pulse rounded-full ${p}`} />
            <div className={`h-28 w-full animate-pulse rounded-2xl ${p}`} />
          </div>
          <div className={`h-96 animate-pulse rounded-3xl ${p}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Section card ─────────────────────────────────────────────────────────────
function SectionCard({ section, isDark, delay }) {
  const hex = section.color || '#64748b'
  const pct = section.available_seats != null && section.total_seats
    ? Math.round((section.available_seats / section.total_seats) * 100)
    : null

  return (
    <div
      className={`anim-scale-in group relative overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${isDark ? 'border-slate-700/60 bg-slate-800/80 hover:border-slate-600 hover:shadow-black/40'
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-200/60'
        } delay-${delay}`}
    >
      {/* left accent bar */}
      <div className="absolute left-0 top-0 h-full w-0.5 rounded-full transition-all duration-300 group-hover:w-1" style={{ backgroundColor: hex }} />

      <div className="pl-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold" style={{ color: hex }}>{section.name}</h3>
          {section.available_seats != null && (
            <span className={`text-[11px] ${section.available_seats < 20 ? 'text-rose-400' : isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {section.available_seats < 20 && section.available_seats > 0 ? `⚡ ${section.available_seats} ghế` : `${section.available_seats} trống`}
            </span>
          )}
        </div>

        <div className={`mt-1 flex items-center gap-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {section.rows && section.cols && (
            <span className="flex items-center gap-1"><IconSeat />{section.rows}×{section.cols}</span>
          )}
        </div>

        {pct != null && (
          <div className={`mt-2.5 h-1 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: hex, opacity: 0.7 }}
            />
          </div>
        )}

        <p className={`mt-2.5 text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {Number(section.price).toLocaleString('vi-VN')} ₫
        </p>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
function EventDetail() {
  const { isDark } = useTheme()
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const heroRef = useRef(null)

  useEffect(() => {
    eventsApi.get(eventId)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  // Subtle parallax on scroll
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const onScroll = () => {
      const y = window.scrollY
      el.style.transform = `translateY(${y * 0.3}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [event])

  if (loading) return <Skeleton isDark={isDark} />

  if (!event) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <div className={`rounded-3xl border p-12 text-center ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
            <p className="text-5xl mb-5">🎭</p>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Không tìm thấy sự kiện</h1>
            <p className={`mt-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sự kiện không tồn tại hoặc đã bị xóa.</p>
            <Link to="/home" className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-400 transition">
              <IconBack /> Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const statusCfg = STATUS_CFG[event.status] ?? STATUS_CFG.finished
  const isOnSale = event.status === 'on_sale'
  const isLongDesc = event.description?.length > DESC_LIMIT
  const shownDesc = isLongDesc && !descExpanded
    ? event.description.slice(0, DESC_LIMIT) + '…'
    : event.description

  const formattedDate = event.event_date
    ? new Date(event.event_date).toLocaleString('vi-VN', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    : null

  return (
    <>
      <style>{KEYFRAMES}</style>

      <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f4f5f9] text-slate-900'}`}>

        {/* ══════════════════════════════════════════
            HERO - full bleed banner with parallax
        ══════════════════════════════════════════ */}
        <div className="relative h-[62vh] min-h-[400px] max-h-[640px] overflow-hidden">

          {/* Parallax image */}
          {event.banner_url ? (
            <div ref={heroRef} className="absolute inset-0 scale-110 will-change-transform">
              <img
                src={event.banner_url}
                alt={event.title}
                onLoad={() => setImgLoaded(true)}
                className={`h-full w-full object-cover transition-opacity duration-700 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              />
              {!imgLoaded && <div className={`absolute inset-0 ${isDark ? 'bg-slate-900' : 'bg-slate-200'} animate-pulse`} />}
            </div>
          ) : (
            <div ref={heroRef} className={`absolute inset-0 scale-110 ${isDark ? 'bg-slate-900' : 'bg-slate-200'}`}>
              {/* Decorative placeholder */}
              <div className="absolute inset-0 opacity-20"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
            </div>
          )}

          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

          {/* Back button */}
          <div className="absolute left-0 right-0 top-0">
            <div className="mx-auto max-w-7xl px-6 pt-6 md:px-8">
              <Link
                to="/home"
                className="anim-fade-in inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:bg-black/50"
              >
                <IconBack />
                Quay lại
              </Link>
            </div>
          </div>

          {/* Hero text - bottom of banner */}
          <div className="absolute bottom-0 left-0 right-0">
            <div className="mx-auto max-w-7xl px-6 pb-8 md:px-8">
              {/* Status badge */}
              <div className="anim-fade-up mb-3">
                <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-sm ${statusCfg.cls}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>

              <h1 className="anim-fade-up delay-100 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-white drop-shadow-xl md:text-5xl lg:text-6xl">
                {event.title}
              </h1>

              {event.artist && (
                <p className="anim-fade-up delay-200 mt-2 text-lg font-medium text-white/70">
                  {event.artist}
                </p>
              )}

              {/* Quick meta pills */}
              <div className="anim-fade-up delay-300 mt-4 flex flex-wrap items-center gap-2">
                {formattedDate && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
                    <IconCal /> {formattedDate}
                  </span>
                )}
                {event.venue_name && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-white/80 backdrop-blur-sm">
                    <IconPin /> {event.venue_name}
                  </span>
                )}
                {event.min_price && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                    Từ {Number(event.min_price).toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            BODY
        ══════════════════════════════════════════ */}
        <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

            {/* ── Left: description + sections ── */}
            <div className="space-y-8">

              {/* Description card */}
              {event.description && (
                <div className={`anim-fade-up delay-300 rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <h2 className={`mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="0" y="0" width="5" height="5" rx="1" /><rect x="7" y="0" width="5" height="5" rx="1" /><rect x="0" y="7" width="5" height="5" rx="1" /><rect x="7" y="7" width="5" height="5" rx="1" /></svg>
                    Giới thiệu
                  </h2>
                  <p className={`whitespace-pre-line text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {shownDesc}
                  </p>
                  {isLongDesc && (
                    <button
                      onClick={() => setDescExpanded(v => !v)}
                      className={`mt-3 inline-flex items-center gap-1 text-sm font-medium transition ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'}`}
                    >
                      {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                      <IconChevron up={descExpanded} />
                    </button>
                  )}
                </div>
              )}

              {/* Venue info */}
              {event.venue_address && (
                <div className={`anim-fade-up delay-500 rounded-3xl border p-6 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <h2 className={`mb-4 text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Địa điểm
                  </h2>
                  <div className={`flex items-start gap-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <span className="mt-0.5 shrink-0 text-sky-500"><IconPin /></span>
                    <div>
                      {event.venue_name && <p className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{event.venue_name}</p>}
                      <p className="mt-0.5">{event.venue_address}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Sections grid */}
              {event.sections?.length > 0 && (
                <div className="anim-fade-up delay-400">
                  <h2 className={`mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="1" y="1" width="10" height="10" rx="2" /><path d="M1 5h10M5 1v10" /></svg>
                    Khu vực & giá vé
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {event.sections.map((section, i) => (
                      <SectionCard
                        key={section.id}
                        section={section}
                        isDark={isDark}
                        delay={(i % 4 + 1) * 100}
                      />
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ── Right: floating action panel ── */}
            <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">

              {/* Main CTA card */}
              <div className={`anim-scale-in delay-200 overflow-hidden rounded-3xl border ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                {/* Gradient top bar */}
                <div className={`h-1.5 w-full ${isOnSale ? 'bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500'
                  : isDark ? 'bg-slate-700' : 'bg-slate-200'
                  }`} />

                <div className="p-6">
                  <div className={`mb-1 text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {isOnSale ? 'Đặt vé ngay' : 'Thông tin'}
                  </div>

                  {/* Price display */}
                  {event.min_price ? (
                    <div className="mb-5">
                      <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Giá từ</p>
                      <p className={`text-3xl font-extrabold tabular-nums ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                        {Number(event.min_price).toLocaleString('vi-VN')}
                        <span className={`ml-1 text-base font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>₫</span>
                      </p>
                    </div>
                  ) : null}

                  {/* Info rows */}
                  <div className={`mb-5 space-y-3 rounded-2xl border p-4 text-sm ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                    {formattedDate && (
                      <div className={`flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="mt-0.5"><IconCal /></span>
                        <span className="leading-relaxed">{formattedDate}</span>
                      </div>
                    )}
                    {event.venue_name && (
                      <div className={`flex items-start gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className="mt-0.5"><IconPin /></span>
                        <span>{event.venue_name}</span>
                      </div>
                    )}
                    {event.available_seats != null && isOnSale && (
                      <div className={`flex items-center gap-2.5 ${event.available_seats < 50 ? 'text-rose-400' : isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <IconSeat />
                        <span>
                          {event.available_seats < 50
                            ? `Chỉ còn ${event.available_seats} ghế!`
                            : `${Number(event.available_seats).toLocaleString('vi-VN')} ghế trống`}
                        </span>
                      </div>
                    )}
                    {event.duration_minutes && (
                      <div className={`flex items-center gap-2.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <IconClock />
                        <span>{event.duration_minutes} phút</span>
                      </div>
                    )}
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2.5">
                    {event.queue_enabled ? (
                      <Link
                        to={`/waiting-room/${event.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-amber-400/25 transition hover:opacity-90 active:scale-[0.98]"
                      >
                        Tham gia Phòng chờ
                        <IconTicket />
                      </Link>
                    ) : isOnSale ? (
                      <Link
                        to={`/seat-map/${event.id}`}
                        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:opacity-90 active:scale-[0.98]"
                      >
                        Chọn ghế ngay
                        <IconTicket />
                      </Link>
                    ) : (
                      <div className={`flex w-full items-center justify-center rounded-2xl py-3.5 text-sm font-semibold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                        {statusCfg.label}
                      </div>
                    )}

                    <Link
                      to="/home"
                      className={`flex w-full items-center justify-center rounded-2xl border py-3 text-sm font-medium transition ${isDark
                        ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                      Khám phá sự kiện khác
                    </Link>
                  </div>
                </div>
              </div>

              {/* Sections mini-summary */}
              {/* {event.sections?.length > 0 && (
                <div className={`anim-scale-in delay-400 rounded-3xl border p-5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                  <p className={`mb-3 text-xs font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    Tóm tắt giá
                  </p>
                  <div className="space-y-2">
                    {event.sections.map(s => (
                      <div key={s.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color || '#64748b' }} />
                          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{s.name}</span>
                        </div>
                        <span className={`text-sm font-semibold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {Number(s.price).toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default EventDetail