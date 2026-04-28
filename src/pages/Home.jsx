import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Banner from '../components/Banner.jsx'
import { getEvents } from '../lib/eventStorage'
import { useAuth } from '../context/AuthContext.jsx'

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
  const [status, setStatus] = useState('all')
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const events = getEvents()
  const search = (searchParams.get('q') ?? '').trim()
  const activeCategory = searchParams.get('category') ?? 'all'

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        !search ||
        event.title.toLowerCase().includes(search.toLowerCase()) ||
        event.artist.toLowerCase().includes(search.toLowerCase()) ||
        event.venue_name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = activeCategory === 'all' ? true : event.category === activeCategory
      const matchesStatus = status === 'all' ? true : event.status === status
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [events, search, activeCategory, status])

  return (
    <div className="bg-slate-950 text-white">
      <Banner />

      <section className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl md:p-6">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-1 text-sm text-cyan-200">
              Discover events, choose seats, and secure QR tickets.
            </p>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-5xl">
              TicketRush brings concerts, festivals, and conferences into one ticketing flow.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
              Search and category chips now live in the header. Use this page to browse event cards, sort by status,
              and jump straight into seat selection or checkout.
            </p>
            {user?.role === 'admin' && (
              <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Admin session detected</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    to="/admin"
                    className="inline-flex items-center rounded-full bg-emerald-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-300"
                  >
                    Switch to admin
                  </Link>
                  <Link
                    to="/admin/events"
                    className="inline-flex items-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Create event
                  </Link>
                </div>
                <p className="mt-3 text-xs text-emerald-100/80">
                  Use admin tools to manage events and configure seat layouts.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 max-w-sm">
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400/40"
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
            <p className="text-sm text-slate-400">Browse event cards with live pricing and seat availability.</p>
          </div>
          <p className="text-sm text-slate-400">{filteredEvents.length} result(s)</p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredEvents.map((event) => (
            <article key={event.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-lg transition hover:-translate-y-1 hover:border-cyan-400/30">
              <div className="h-52 overflow-hidden">
                <img src={event.banner_url} alt={event.title} className="h-full w-full object-cover" />
              </div>
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <p className="text-sm text-slate-400">{event.artist}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyle[event.status]}`}>
                    {statusLabel[event.status]}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-slate-300">
                  <p>{new Date(event.event_date).toLocaleString()}</p>
                  <p>{event.venue_name}</p>
                  <p>From {event.min_price.toLocaleString()} VND</p>
                  <p>{event.available_seats.toLocaleString()} seats remaining</p>
                </div>

                <Link to={`/events/${event.id}`} className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  View details
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Home
