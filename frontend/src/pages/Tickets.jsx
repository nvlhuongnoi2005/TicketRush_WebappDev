import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ticketsApi } from '../lib/api'

const badgeStyle = {
  valid: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  used: 'bg-slate-400/15 text-slate-300 border-slate-400/30',
  cancelled: 'bg-rose-400/15 text-rose-300 border-rose-400/30',
}

function Tickets() {
  const location = useLocation()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [successMsg, setSuccessMsg] = useState(location.state?.message || '')

  useEffect(() => {
    ticketsApi.list()
      .then(setTickets)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return tickets
    return tickets.filter((t) => (t.status || 'valid') === filter)
  }, [tickets, filter])

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Vé của tôi</p>
          <h1 className="text-3xl font-semibold">Ticket library</h1>
        </div>

        {successMsg && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-300">
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="ml-4 text-emerald-400 hover:text-emerald-300">✕</button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="mb-5 flex items-center gap-3">
          {['all', 'valid', 'used', 'cancelled'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                filter === f
                  ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-300'
                  : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
              }`}
            >
              {f === 'all' ? 'Tất cả' : f}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400">Đang tải vé...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <p className="text-slate-400">Không có vé nào.</p>
            <Link to="/" className="mt-4 inline-flex rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950">
              Xem sự kiện
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((ticket) => (
              <article key={ticket.id} className="rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-cyan-400/20">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{ticket.event_title}</h2>
                    <p className="text-sm text-slate-400">
                      {ticket.seat_label}{ticket.section_name ? ` · ${ticket.section_name}` : ''}
                    </p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeStyle[ticket.status] || badgeStyle.valid}`}>
                    {ticket.status || 'valid'}
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-4">
                  {ticket.qr_image_url && (
                    <img
                      src={ticket.qr_image_url}
                      alt={ticket.qr_data}
                      className="h-24 w-24 rounded-xl bg-white p-1"
                    />
                  )}
                  <div className="space-y-1 text-sm text-slate-300">
                    {ticket.event_date && <p>{new Date(ticket.event_date).toLocaleString('vi-VN')}</p>}
                    {ticket.venue_name && <p>{ticket.venue_name}</p>}
                    <p className="font-medium text-white">{Number(ticket.price || 0).toLocaleString()} VND</p>
                  </div>
                </div>

                <Link
                  to={`/tickets/${ticket.id}`}
                  className="inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                >
                  Xem chi tiết
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export default Tickets
