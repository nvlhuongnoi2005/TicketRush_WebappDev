import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getTickets } from '../lib/ticketStorage'

const badgeStyle = {
  valid: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  used: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
  cancelled: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
}

function Tickets() {
  const location = useLocation()
  const [tickets, setTickets] = useState(() => getTickets())

  useEffect(() => {
    setTickets(getTickets())
    if (location.state?.message) {
      alert(location.state.message)
    }
  }, [location.state])

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">My tickets</p>
          <h1 className="text-3xl font-semibold">Ticket library</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{ticket.event_title}</h2>
                  <p className="text-sm text-slate-600">
                    {ticket.seat_label} • {ticket.section_name}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeStyle[ticket.status]}`}>
                  {ticket.status}
                </span>
              </div>

              <div className="mb-4 flex items-center gap-4">
                <img src={ticket.qr_image_url} alt={ticket.qr_data} className="h-28 w-28 rounded-2xl bg-white p-2" />
                <div className="space-y-2 text-sm text-slate-600">
                  <p>{new Date(ticket.event_date).toLocaleString()}</p>
                  <p>{ticket.venue_name}</p>
                  <p>{ticket.price.toLocaleString()} VND</p>
                </div>
              </div>

              <Link
                to={`/tickets/${ticket.id}`}
                className="inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white"
              >
                View ticket details
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Tickets
