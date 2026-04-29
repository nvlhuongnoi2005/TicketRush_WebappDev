import { Link, useParams } from 'react-router-dom'
import { getEventById } from '../lib/eventStorage'

function EventDetail() {
  const { eventId } = useParams()
  const event = getEventById(eventId)

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-slate-900 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Event not found</h1>
          <p className="mt-3 text-slate-600">The event you are looking for does not exist.</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-sky-500 px-4 py-2 font-semibold text-white">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
          </div>

          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">
            <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs uppercase tracking-[0.2em] text-sky-700">
              Event details
            </span>
            <div>
              <h1 className="text-3xl font-semibold md:text-5xl">{event.title}</h1>
              <p className="mt-2 text-slate-600">{event.artist}</p>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>{new Date(event.event_date).toLocaleString()}</p>
              <p>{event.venue_name}</p>
              <p>{event.venue_address}</p>
              <p>{event.description}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {event.sections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-semibold" style={{ color: section.color }}>
                      {section.name}
                    </h2>
                    <span className="text-xs text-slate-500">{section.available_seats} left</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {section.rows} rows × {section.cols} seats
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-900">{section.price.toLocaleString()} VND</p>
                </div>
              ))}
            </div>
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
              <Link to="/" className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-900">
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
