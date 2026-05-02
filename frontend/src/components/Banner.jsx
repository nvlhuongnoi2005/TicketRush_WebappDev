import { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { eventsApi } from '../lib/api'

function Banner() {
  const [featuredEvents, setFeaturedEvents] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    eventsApi.list()
      .then((events) => setFeaturedEvents(events.slice(0, 5)))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (featuredEvents.length <= 1) return
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredEvents.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [featuredEvents.length])

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

  const goToSlide = (nextIndex) => {
    setActiveIndex(((nextIndex % featuredEvents.length) + featuredEvents.length) % featuredEvents.length)
  }

  return (
    <section className="relative w-full overflow-hidden text-white">

      {/* ── Full-bleed background: cross-fading banner images ── */}
      <div className="absolute inset-0 z-0">
        {featuredEvents.map((ev, i) => (
          <div
            key={ev.id}
            className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            style={{ opacity: i === activeIndex ? 1 : 0 }}
          >
            {ev.banner_url
              ? <img src={ev.banner_url} alt="" aria-hidden className="h-full w-full object-cover" />
              : <div className="h-full w-full bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900" />
            }
          </div>
        ))}
        {/* readability overlays - preserves original emerald→cyan→blue tint */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/65 to-slate-950/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/15 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/35 via-cyan-950/10 to-blue-950/35" />
      </div>

      {/* ── Content wrapper ── */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-2xl shadow-black/40 backdrop-blur-sm">
          <div className="relative min-h-[36rem]">
            {featuredEvents.map((event, index) => {
              const isActive = index === activeIndex
              return (
                <div
                  key={event.id}
                  className={`absolute inset-0 grid items-center gap-8 p-6 transition-all duration-700 ease-out md:grid-cols-[1.1fr_0.9fr] md:p-8 lg:p-10 ${isActive
                    ? 'pointer-events-auto translate-x-0 opacity-100'
                    : 'pointer-events-none translate-x-5 opacity-0'
                    }`}
                >
                  {/* subtle left vignette inside card */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/25 via-transparent to-transparent" />

                  {/* ── Left: text ── */}
                  <div className="relative z-10 max-w-xl space-y-4">

                    {/* badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/8 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/75 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Sự kiện nổi bật
                      </span>
                      {event.category && (
                        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
                          {event.category}
                        </span>
                      )}
                    </div>

                    {/* title */}
                    <h1 className="text-3xl font-extrabold leading-[1.1] tracking-tight drop-shadow-md md:text-5xl lg:text-6xl">
                      {event.title}
                    </h1>

                    {/* artist */}
                    {event.artist && (
                      <p className="text-base font-medium text-emerald-300/90">{event.artist}</p>
                    )}

                    {/* info pills */}
                    <div className="flex flex-wrap gap-2 text-sm">
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

                    {/* description */}
                    {event.description && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-white/50">
                        {event.description}
                      </p>
                    )}

                    {/* CTAs */}
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Link
                        to={`/events/${event.id}`}
                        className="group relative overflow-hidden rounded-full bg-white px-6 py-3 font-semibold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:shadow-white/20"
                      >
                        <span className="relative z-10">Xem chi tiết</span>
                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-emerald-100 to-white transition-transform duration-300 group-hover:translate-x-0" />
                      </Link>
                      {/* <Link
                        to={`/seat-map/${event.id}`}
                        className="rounded-full border border-white/25 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/18"
                      >
                        Chọn ghế →
                      </Link> */}
                    </div>

                    {/* dot indicators */}
                    {/* <div className="flex items-center gap-2 pt-1">
                      {featuredEvents.map((item, dotIndex) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => goToSlide(dotIndex)}
                          className={`h-1.5 rounded-full transition-all duration-300 ${dotIndex === activeIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/55'
                            }`}
                          aria-label={`Slide ${dotIndex + 1}`}
                        />
                      ))}
                    </div> */}
                  </div>

                  {/* ── Right: image card ── */}
                  {event.banner_url && (
                    <div className="relative z-10 hidden md:block">
                      <div className="overflow-hidden rounded-2xl border border-white/12 shadow-2xl shadow-black/40">
                        <img
                          src={event.banner_url}
                          alt={event.title}
                          className="h-72 w-full object-cover md:h-80 lg:h-96"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      </div>
                      <div className="pointer-events-none absolute -inset-3 -z-10 rounded-3xl bg-cyan-500/8 blur-2xl" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Prev / Next ── */}
        {featuredEvents.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 px-1 md:px-2">
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              aria-label="Previous featured event"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-black/55 cursor-pointer"
            >
              <FaChevronLeft size={11} />
              Trước
            </button>

            {/* <span className="tabular-nums text-xs text-white/30">
              {String(activeIndex + 1).padStart(2, '0')} / {String(featuredEvents.length).padStart(2, '0')}
            </span> */}

            <div className="flex items-center gap-2 pt-1">
              {featuredEvents.map((item, dotIndex) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSlide(dotIndex)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${dotIndex === activeIndex ? 'w-8 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/55'
                    }`}
                  aria-label={`Slide ${dotIndex + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              aria-label="Next featured event"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/30 hover:bg-black/55 cursor-pointer"
            >
              Tiếp
              <FaChevronRight size={11} />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Banner