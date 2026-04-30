import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Banner from '../components/Banner.jsx'
import { eventsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const statusLabel = {
  on_sale: 'On Sale',
  upcoming: 'Upcoming',
  sold_out: 'Sold Out',
  finished: 'Finished',
}

const statusStyle = {
  on_sale: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  upcoming: 'bg-sky-400/15 text-sky-300 border-sky-400/30',
  sold_out: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
  finished: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
}

function Home() {
  const { isDark } = useTheme()
  const [status, setStatus] = useState('all')
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const search = (searchParams.get('q') ?? '').trim()

  useEffect(() => {
    setLoading(true)
    eventsApi.list()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !search ||
        event.title?.toLowerCase().includes(search.toLowerCase()) ||
        event.artist?.toLowerCase().includes(search.toLowerCase()) ||
        event.venue_name?.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = status === 'all' || event.status === status
      return matchesSearch && matchesStatus
    })
  }, [events, search, status])

  return (
    <div className={`${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <Banner />

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className={`rounded-3xl border p-5 shadow-lg md:p-6 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div>
            <p className={`mb-3 inline-flex rounded-full border px-4 py-1 text-sm ${isDark ? 'border-sky-900 bg-sky-950 text-sky-400' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
              Discover events, choose seats, and secure QR tickets.
            </p>
            <h1 className={`max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
              TicketRush brings concerts, festivals, and conferences into one ticketing flow.
            </h1>
            <p className={`mt-4 max-w-2xl text-sm leading-7 md:text-base ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Search and category chips now live in the header. Use this page to browse event cards, sort by status,
              and jump straight into seat selection or checkout.
            </p>
            {user?.role === 'admin' && (
              <div className={`mt-6 rounded-2xl border p-4 ${isDark ? 'border-emerald-900 bg-emerald-950' : 'border-emerald-200 bg-emerald-50'}`}>
                <p className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>Admin session detected</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    to="/admin"
                    className="inline-flex items-center rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                  >
                    Switch to admin
                  </Link>
                  <Link
                    to="/admin/events/create"
                    className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Create event
                  </Link>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 max-w-sm">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-500">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`w-full rounded-xl border px-4 py-3 text-sm outline-none focus:border-sky-400/40 ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
            >
              <option value="all">All</option>
              <option value="on_sale">On Sale</option>
              <option value="upcoming">Upcoming</option>
              <option value="sold_out">Sold Out</option>
              <option value="finished">Finished</option>
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Featured events</h2>
            <p className="text-sm text-slate-600">Browse event cards with live pricing and seat availability.</p>
          </div>
          <p className="text-sm text-slate-600">{filteredEvents.length} result(s)</p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-slate-400">No events found.</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredEvents.map((event) => (
              <article key={event.id} className={`overflow-hidden rounded-3xl border shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/30 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
                <div className="h-52 overflow-hidden">
                  <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold">{event.title}</h3>
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{event.artist}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyle[event.status]}`}>
                      {statusLabel[event.status]}
                    </span>
                  </div>

                  <div className={`space-y-2 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    <p>{new Date(event.event_date).toLocaleString()}</p>
                    <p>{event.venue_name}</p>
                    {event.min_price && <p>From {event.min_price.toLocaleString()} VND</p>}
                    {event.available_seats != null && <p>{event.available_seats.toLocaleString()} seats remaining</p>}
                  </div>

                  <Link to={`/events/${event.id}`} className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                    View details
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Home
