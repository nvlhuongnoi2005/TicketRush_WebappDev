import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

function TicketDetail() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    ticketsApi.get(ticketId)
      .then(setTicket)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ticketId, user])

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-400 md:px-8">
        Loading ticket...
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-white md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-semibold">Ticket not found</h1>
          <Link to="/tickets" className="mt-6 inline-flex rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
            Back to tickets
          </Link>
        </div>
      </div>
    )
  }

  const handleDownload = () => {
    if (!ticket.qr_image_url) return
    const link = document.createElement('a')
    link.href = ticket.qr_image_url
    link.download = `${ticket.qr_data || `ticket-${ticket.id}`}.png`
    link.click()
  }

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white p-6">
            {ticket.qr_image_url ? (
              <img src={ticket.qr_image_url} alt={ticket.qr_data} className="mx-auto h-64 w-64 rounded-2xl" />
            ) : (
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 text-sm">
                No QR available
              </div>
            )}
            <p className="mt-4 text-center text-xs text-slate-500">Scan at the venue entrance</p>
          </div>

          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Ticket details</p>
            <h1 className="text-3xl font-semibold">{ticket.event_title}</h1>
            <div className="space-y-2 text-sm text-slate-300">
              {ticket.qr_data && <p>Ticket code: {ticket.qr_data}</p>}
              {ticket.event_date && <p>Event date: {new Date(ticket.event_date).toLocaleString()}</p>}
              {ticket.venue_name && <p>Venue: {ticket.venue_name}</p>}
              {ticket.section_name && <p>Section: {ticket.section_name}</p>}
              {ticket.seat_label && <p>Seat: {ticket.seat_label}</p>}
              <p>Price: {ticket.price.toLocaleString()} VND</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {ticket.qr_image_url && (
                <button onClick={handleDownload} className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
                  Download QR
                </button>
              )}
              <Link to="/tickets" className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white">
                Back to tickets
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TicketDetail
