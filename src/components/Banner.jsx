import { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { Link } from 'react-router-dom'
import { getEvents } from '../lib/eventStorage'

function Banner() {
  const featuredEvents = getEvents().slice(0, 3)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (featuredEvents.length <= 1) {
      return undefined
    }

    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % featuredEvents.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [featuredEvents.length])

  if (!featuredEvents.length) {
    return (
      <section className="w-full bg-linear-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
          <div className="rounded-4xl border border-white/15 bg-black/20 p-8 backdrop-blur">
            <p className="text-sm uppercase tracking-[0.2em] text-white/80">Featured events</p>
            <h1 className="mt-3 text-3xl font-bold md:text-5xl">No featured events available yet.</h1>
            <p className="mt-4 max-w-2xl text-white/90">
              Create or publish events in the admin area and they will appear here automatically.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const activeEvent = featuredEvents[activeIndex]

  const goToSlide = (nextIndex) => {
    setActiveIndex((currentIndex) => (nextIndex + featuredEvents.length) % featuredEvents.length)
  }

  return (
    <section className="w-full bg-linear-to-r from-emerald-500 via-cyan-500 to-blue-600 text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 lg:py-14">
        <div className="relative overflow-hidden rounded-4xl border border-white/15 bg-black/20 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="relative min-h-144">
            {featuredEvents.map((event, index) => {
              const isActive = index === activeIndex

              return (
                <div
                  key={event.id}
                  className={`absolute inset-0 grid items-center gap-8 p-6 transition-all duration-700 ease-out md:grid-cols-[1.05fr_0.95fr] md:p-8 lg:p-10 ${
                    isActive ? 'pointer-events-auto opacity-100 translate-x-0' : 'pointer-events-none opacity-0 translate-x-6'
                  }`}
                >
                  <div className="absolute inset-0 bg-linear-to-r from-slate-950/55 via-slate-950/25 to-transparent" />
                  <div className="relative z-10 max-w-2xl space-y-5">
                    <span className="inline-flex rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
                      Featured event
                    </span>
                    <h1 className="text-3xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                      {event.title}
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-white/90 md:text-lg">
                      {event.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm text-white/90">
                      <span className="rounded-full bg-white/10 px-4 py-2">{event.artist}</span>
                      <span className="rounded-full bg-white/10 px-4 py-2">{event.venue_name}</span>
                      <span className="rounded-full bg-white/10 px-4 py-2">From {event.min_price.toLocaleString()} VND</span>
                    </div>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Link
                        to={`/events/${event.id}`}
                        className="rounded-full bg-white px-6 py-3 font-semibold text-slate-950 transition hover:bg-white/90"
                      >
                        View details
                      </Link>
                      <Link
                        to={`/seat-map/${event.id}`}
                        className="rounded-full border border-white/30 bg-white/10 px-6 py-3 font-semibold text-white transition hover:bg-white/20"
                      >
                        Choose seats
                      </Link>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                      {featuredEvents.map((item, dotIndex) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => goToSlide(dotIndex)}
                          className={`h-2.5 rounded-full transition-all ${dotIndex === activeIndex ? 'w-10 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/75'}`}
                          aria-label={`Show featured event ${dotIndex + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 overflow-hidden rounded-[1.75rem] border border-white/15 shadow-2xl shadow-black/30">
                    <img src={event.banner_url} alt={event.title} className="h-80 w-full object-cover md:h-96" />
                  </div>
                </div>
              )
            })}

          </div>
        </div>

        {featuredEvents.length > 1 && (
          <div className="mt-4 flex items-center justify-between gap-3 px-2 md:px-4">
            <button
              type="button"
              onClick={() => goToSlide(activeIndex - 1)}
              aria-label="Previous featured event"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/50 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-slate-950/75"
            >
              <FaChevronLeft />
              Previous
            </button>

            <button
              type="button"
              onClick={() => goToSlide(activeIndex + 1)}
              aria-label="Next featured event"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/50 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-slate-950/75"
            >
              Next
              <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default Banner
