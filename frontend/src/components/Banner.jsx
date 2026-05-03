import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { eventsApi } from '../lib/api'

// ─── Animations ───────────────────────────────────────────────────────────────
const CSS = `
/* ── Slide content entry ── */
@keyframes bnSlideUp {
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes bnSlideRight {
  from { opacity: 0; transform: translateX(-24px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes bnFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes bnImageReveal {
  from { opacity: 0; transform: scale(1.06) translateX(20px); }
  to   { opacity: 1; transform: scale(1) translateX(0); }
}

/* ── Background parallax zoom ── */
@keyframes bnBgZoom {
  from { transform: scale(1.08); }
  to   { transform: scale(1); }
}

/* ── Progress bar ── */
@keyframes bnProgress {
  from { width: 0%; }
  to   { width: 100%; }
}

/* ── Shimmer sweep on image ── */
@keyframes bnShimmer {
  0%   { transform: translateX(-100%) skewX(-12deg); }
  100% { transform: translateX(250%) skewX(-12deg); }
}

/* ── Floating particle ── */
@keyframes bnFloat {
  0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.4; }
  33%       { transform: translateY(-18px) rotate(5deg); opacity: 0.7; }
  66%       { transform: translateY(-8px) rotate(-3deg); opacity: 0.5; }
}

/* ── Badge pop-in ── */
@keyframes bnPopIn {
  from { opacity: 0; transform: scale(0.8) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

/* ── Glow pulse on CTA ── */
@keyframes bnGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
  50%       { box-shadow: 0 0 24px 4px rgba(255,255,255,0.15); }
}

/* ── Dot active indicator ── */
@keyframes bnDotGrow {
  from { width: 6px; }
  to   { width: 32px; }
}

.bn-slide-up-1  { animation: bnSlideUp 0.6s cubic-bezier(.22,1,.36,1) 0.05s both; }
.bn-slide-up-2  { animation: bnSlideUp 0.6s cubic-bezier(.22,1,.36,1) 0.15s both; }
.bn-slide-up-3  { animation: bnSlideUp 0.6s cubic-bezier(.22,1,.36,1) 0.25s both; }
.bn-slide-up-4  { animation: bnSlideUp 0.6s cubic-bezier(.22,1,.36,1) 0.35s both; }
.bn-slide-up-5  { animation: bnSlideUp 0.6s cubic-bezier(.22,1,.36,1) 0.45s both; }
.bn-slide-up-6  { animation: bnSlideUp 0.6s cubic-bezier(.22,1,.36,1) 0.55s both; }

.bn-slide-right { animation: bnSlideRight 0.55s cubic-bezier(.22,1,.36,1) 0.1s both; }
.bn-fade-in     { animation: bnFadeIn 0.5s ease 0.1s both; }
.bn-image-reveal { animation: bnImageReveal 0.8s cubic-bezier(.22,1,.36,1) 0.2s both; }
.bn-bg-zoom     { animation: bnBgZoom 1.4s cubic-bezier(.22,1,.36,1) both; }
.bn-pop-in      { animation: bnPopIn 0.45s cubic-bezier(.34,1.56,.64,1) both; }
.bn-glow        { animation: bnGlow 3s ease infinite; }

.bn-pop-1  { animation-delay: 0.05s; }
.bn-pop-2  { animation-delay: 0.15s; }

.bn-float-1 { animation: bnFloat 7s ease infinite; }
.bn-float-2 { animation: bnFloat 9s ease 1.5s infinite; }
.bn-float-3 { animation: bnFloat 11s ease 3s infinite; }

.bn-shimmer-sweep::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%);
  transform: translateX(-100%) skewX(-12deg);
  animation: bnShimmer 2.5s ease 0.8s;
}

.bn-progress {
  animation: bnProgress linear forwards;
}
`

// ─── Floating particles (decorative) ─────────────────────────────────────────
function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {[
        { cls: 'bn-float-1', top: '15%', left: '8%', size: 4, opacity: 0.25 },
        { cls: 'bn-float-2', top: '70%', left: '5%', size: 6, opacity: 0.18 },
        { cls: 'bn-float-3', top: '35%', left: '15%', size: 3, opacity: 0.20 },
        { cls: 'bn-float-1', top: '55%', right: '12%', size: 5, opacity: 0.15 },
        { cls: 'bn-float-2', top: '20%', right: '8%', size: 3, opacity: 0.20 },
      ].map((p, i) => (
        <div
          key={i}
          className={`absolute rounded-full bg-white ${p.cls}`}
          style={{
            top: p.top, left: p.left, right: p.right,
            width: p.size, height: p.size,
            opacity: p.opacity,
          }}
        />
      ))}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────
function ProgressBar({ duration, active, isDark }) {
  const [key, setKey] = useState(0)
  useEffect(() => { if (active) setKey(k => k + 1) }, [active])
  if (!active) return null
  return (
    <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${isDark ? 'bg-white/10' : 'bg-white/15'}`}>
      <div
        key={key}
        className="bn-progress h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-400 rounded-full"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  )
}

// ─── Slide icon chevrons ───────────────────────────────────────────────────────
function ChevLeft() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 4l-4 4 4 4" />
    </svg>
  )
}
function ChevRight() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4l4 4-4 4" />
    </svg>
  )
}

// ─── Main Banner ─────────────────────────────────────────────────────────────
const SLIDE_DURATION = 5000

function Banner() {
  const [featuredEvents, setFeaturedEvents] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [prevIndex, setPrevIndex] = useState(null)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = back
  const [animKey, setAnimKey] = useState(0)     // forces re-animation on slide change
  const timerRef = useRef(null)

  useEffect(() => {
    eventsApi.list()
      .then(events => {
        const onSaleEvents = events
          .filter(event => event.status === 'on_sale')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)

        setFeaturedEvents(onSaleEvents)
      })
      .catch(console.error)
  }, [])

  const goToSlide = (nextRaw, dir = 1) => {
    const len = featuredEvents.length
    if (!len) return
    const next = ((nextRaw % len) + len) % len
    setPrevIndex(activeIndex)
    setDirection(dir)
    setActiveIndex(next)
    setAnimKey(k => k + 1)
  }

  // Auto-advance
  useEffect(() => {
    if (featuredEvents.length <= 1) return
    timerRef.current = setInterval(() => {
      setActiveIndex(cur => {
        const next = (cur + 1) % featuredEvents.length
        setPrevIndex(cur)
        setDirection(1)
        setAnimKey(k => k + 1)
        return next
      })
    }, SLIDE_DURATION)
    return () => clearInterval(timerRef.current)
  }, [featuredEvents.length])

  // ── Empty state ──
  if (!featuredEvents.length) {
    return (
      <section className="relative w-full overflow-hidden text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-cyan-900 to-blue-900" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
          <div className="rounded-3xl border border-white/10 bg-black/25 p-8 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/50">Featured events</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">Chưa có sự kiện nổi bật.</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65">
              Đăng tải sự kiện từ khu vực admin - chúng sẽ tự động xuất hiện tại đây.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const event = featuredEvents[activeIndex]

  return (
    <>
      <style>{CSS}</style>
      <section className="relative w-full overflow-hidden text-white select-none">

        {/* ── Full-bleed background: cross-fading + zoom ── */}
        <div className="absolute inset-0 z-0">
          {featuredEvents.map((ev, i) => (
            <div
              key={ev.id}
              className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
              style={{ opacity: i === activeIndex ? 1 : 0 }}
            >
              {ev.banner_url
                ? (
                  <img
                    src={ev.banner_url}
                    alt=""
                    aria-hidden
                    className={`h-full w-full object-cover ${i === activeIndex ? 'bn-bg-zoom' : ''}`}
                    key={`bg-${ev.id}-${i === activeIndex ? animKey : 'idle'}`}
                  />
                )
                : <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
              }
            </div>
          ))}
          {/* Layered overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/65 to-slate-950/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/30 via-cyan-950/10 to-blue-950/30" />
          {/* Vignette corners */}
          <div className="absolute inset-0 [background:radial-gradient(ellipse_at_top_right,transparent_50%,rgba(0,0,0,0.35)_100%)]" />
        </div>

        {/* Floating particles */}
        <Particles />

        {/* ── Content wrapper ── */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-2xl shadow-black/50 backdrop-blur-sm">

            {/* Progress bar */}
            {featuredEvents.length > 1 && (
              <ProgressBar duration={SLIDE_DURATION} active key={`pb-${activeIndex}`} />
            )}

            <div className="relative min-h-[36rem]">
              {/* Only render active slide — re-keyed to retrigger animations */}
              <div
                key={`slide-${activeIndex}-${animKey}`}
                className="absolute inset-0 grid items-center gap-8 p-6 md:grid-cols-[1.1fr_0.9fr] md:p-8 lg:p-10"
              >
                {/* subtle left vignette inside card */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent pointer-events-none" />

                {/* ── Left: text content with staggered entry ── */}
                <div className="relative z-10 max-w-xl space-y-4">

                  {/* Badges */}
                  <div className="bn-pop-in bn-pop-1 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Sự kiện nổi bật
                    </span>
                    {event.category && (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                        {event.category}
                      </span>
                    )}
                    {/* Slide counter badge */}
                    <span className="ml-auto rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-[10px] font-bold tabular-nums text-white/40">
                      {String(activeIndex + 1).padStart(2, '0')} / {String(featuredEvents.length).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Title */}
                  <h1 className="bn-slide-up-2 text-3xl font-extrabold leading-[1.1] tracking-tight drop-shadow-lg md:text-5xl lg:text-6xl">
                    {event.title}
                  </h1>

                  {/* Artist */}
                  {event.artist && (
                    <p className="bn-slide-up-3 text-base font-medium text-emerald-300/90">
                      {event.artist}
                    </p>
                  )}

                  {/* Info pills */}
                  <div className="bn-slide-up-4 flex flex-wrap gap-2 text-sm">
                    {event.venue_name && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3.5 py-1.5 text-xs text-white/75 backdrop-blur-sm">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-70">
                          <path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" />
                          <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" />
                        </svg>
                        {event.venue_name}
                      </span>
                    )}
                    {event.event_date && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3.5 py-1.5 text-xs text-white/75 backdrop-blur-sm">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-70">
                          <rect x="2" y="3" width="12" height="11" rx="2" />
                          <path d="M5 2v2M11 2v2M2 7h12" />
                        </svg>
                        {new Date(event.event_date).toLocaleDateString('vi-VN', {
                          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </span>
                    )}
                    {event.min_price && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3.5 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-80">
                          <path d="M2 6a1 1 0 0 0 0-2V3h12v1a1 1 0 0 0 0 2v1a1 1 0 0 0 0 2v1H2v-1a1 1 0 0 0 0-2V6Z" />
                        </svg>
                        Từ {Number(event.min_price).toLocaleString('vi-VN')} ₫
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="bn-slide-up-5 line-clamp-2 text-sm leading-relaxed text-white/50">
                      {event.description}
                    </p>
                  )}

                  {/* CTAs */}
                  <div className="bn-slide-up-6 flex flex-wrap items-center gap-3 pt-1">
                    <Link
                      to={`/events/${event.id}`}
                      className="bn-glow group relative overflow-hidden rounded-full bg-white px-6 py-3 font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-white/15"
                    >
                      <span className="relative z-10 flex items-center gap-2">
                        Xem chi tiết
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="transition-transform group-hover:translate-x-0.5">
                          <path d="M2 7h10M8 3l4 4-4 4" />
                        </svg>
                      </span>
                      {/* sweep shimmer on hover */}
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-100 to-white transition-transform duration-300 group-hover:translate-x-0" />
                    </Link>
                  </div>
                </div>

                {/* ── Right: image card with shimmer + depth ── */}
                {event.banner_url && (
                  <div className="relative z-10 hidden md:block">
                    <div className="bn-image-reveal relative overflow-hidden rounded-2xl border border-white/12 shadow-2xl shadow-black/50 bn-shimmer-sweep">
                      <img
                        src={event.banner_url}
                        alt={event.title}
                        className="h-72 w-full object-cover md:h-80 lg:h-96 transition-transform duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      {/* Corner accent */}
                      <div className="absolute bottom-3 right-3 rounded-xl border border-white/15 bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-white/60 backdrop-blur-sm">
                        {event.status === 'on_sale' ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                            Đang mở bán
                          </span>
                        ) : event.status === 'sold_out' ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                            Hết vé
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {/* Glow halo behind image */}
                    <div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-cyan-500/10 blur-2xl" />
                    <div className="pointer-events-none absolute -inset-2 -z-10 rounded-3xl bg-emerald-500/8 blur-xl" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Prev / Next + dots ── */}
          {featuredEvents.length > 1 && (
            <div className="mt-4 flex items-center justify-between gap-3 px-1 md:px-2">
              <button
                type="button"
                onClick={() => goToSlide(activeIndex - 1, -1)}
                aria-label="Sự kiện trước"
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-black/55 hover:-translate-x-0.5 cursor-pointer"
              >
                <ChevLeft />
                <span className="transition-opacity group-hover:opacity-100 opacity-80">Trước</span>
              </button>

              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {featuredEvents.map((item, dotIndex) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToSlide(dotIndex, dotIndex > activeIndex ? 1 : -1)}
                    aria-label={`Slide ${dotIndex + 1}`}
                    aria-current={dotIndex === activeIndex ? 'true' : undefined}
                    className="cursor-pointer"
                    style={{
                      height: 6,
                      width: dotIndex === activeIndex ? 32 : 6,
                      borderRadius: 999,
                      background: dotIndex === activeIndex
                        ? 'linear-gradient(90deg, #34d399, #22d3ee)'
                        : 'rgba(255,255,255,0.25)',
                      transition: 'width 0.35s cubic-bezier(.22,1,.36,1), background 0.3s ease',
                    }}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToSlide(activeIndex + 1, 1)}
                aria-label="Sự kiện tiếp theo"
                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-black/55 hover:translate-x-0.5 cursor-pointer"
              >
                <span className="transition-opacity group-hover:opacity-100 opacity-80">Tiếp</span>
                <ChevRight />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}

export default Banner