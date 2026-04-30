import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { eventsApi } from '../lib/api'
import { useTheme } from '../context/ThemeContext.jsx'

const DESC_LIMIT = 220

function EventDetail() {
  const { isDark } = useTheme()
  const { eventId } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [descExpanded, setDescExpanded] = useState(false)

  useEffect(() => {
    eventsApi.get(eventId)
      .then(setEvent)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-400 md:px-8">
        Loading event...
      </div>
    )
  }

  if (!event) {
    return (
      <div className={`mx-auto max-w-7xl px-4 py-16 md:px-8 ${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
        <div className={`rounded-3xl border p-8 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
          <h1 className="text-3xl font-semibold">Event not found</h1>
          <p className={`mt-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>The event you are looking for does not exist.</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-sky-500 px-4 py-2 font-semibold text-white">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {event.banner_url && (
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5">
              <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
            </div>
          )}

          <div className={`space-y-5 rounded-3xl border p-6 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${isDark ? 'border-sky-900 bg-sky-950 text-sky-300' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
              Event details
            </span>
            <div>
              <h1 className="text-3xl font-semibold md:text-5xl">{event.title}</h1>
              {event.artist && <p className="mt-2 text-slate-400">{event.artist}</p>}
            </div>
            <div className={`space-y-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <p>{new Date(event.event_date).toLocaleString()}</p>
              {event.venue_name && <p>{event.venue_name}</p>}
              {event.venue_address && <p>{event.venue_address}</p>}
              {event.description && (() => {
                const isLong = event.description.length > DESC_LIMIT
                const shown = isLong && !descExpanded
                  ? event.description.slice(0, DESC_LIMIT) + '…'
                  : event.description
                return (
                  <div>
                    <p>{shown}</p>
                    {isLong && (
                      <button
                        onClick={() => setDescExpanded((v) => !v)}
                        className="mt-1 text-sm text-sky-400 transition hover:text-sky-300"
                      >
                        {descExpanded ? 'Thu gọn' : 'Xem thêm'}
                      </button>
                    )}
                  </div>
                )
              })()}
            </div>
            {event.sections && event.sections.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {event.sections.map((section) => (
                  <div key={section.id} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-100'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold" style={{ color: section.color }}>
                        {section.name}
                      </h2>
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.available_seats} left</span>
                    </div>
                    <p className={`mt-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {section.rows} rows × {section.cols} seats
                    </p>
                    <p className={`mt-1 text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{section.price.toLocaleString()} VND</p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {event.queue_enabled ? (
                <Link to={`/waiting-room/${event.id}`} className="rounded-full bg-amber-300 px-5 py-3 font-semibold text-slate-950">
                  Join waiting room
                </Link>
              ) : (
                <Link to={`/seat-map/${event.id}`} className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950">
                  Select seats
                </Link>
              )}
              <Link to="/" className={`rounded-full border px-5 py-3 font-semibold ${isDark ? 'border-slate-700 text-slate-50 hover:bg-slate-700' : 'border-slate-200 text-slate-900 hover:bg-slate-100'} transition`}>
                Back to events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default EventDetail
