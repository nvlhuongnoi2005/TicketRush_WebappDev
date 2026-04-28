import { Link, useParams } from 'react-router-dom'
import { getTickets } from '../lib/ticketStorage'

function TicketDetail() {
  const { ticketId } = useParams()
  const ticket = getTickets().find((entry) => entry.id === Number(ticketId))

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
    const link = document.createElement('a')
    link.href = ticket.qr_image_url
    link.download = `${ticket.qr_data}.png`
    link.click()
  }

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white p-6">
            <img src={ticket.qr_image_url} alt={ticket.qr_data} className="mx-auto h-64 w-64 rounded-2xl" />
            <p className="mt-4 text-center text-xs text-slate-500">Scan at the venue entrance</p>
          </div>

          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Ticket details</p>
            <h1 className="text-3xl font-semibold">{ticket.event_title}</h1>
            <div className="space-y-2 text-sm text-slate-300">
              <p>Ticket code: {ticket.qr_data}</p>
              <p>Event date: {new Date(ticket.event_date).toLocaleString()}</p>
              <p>Venue: {ticket.venue_name}</p>
              <p>Section: {ticket.section_name}</p>
              <p>Seat: {ticket.seat_label}</p>
              <p>Price: {ticket.price.toLocaleString()} VND</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleDownload} className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
                Download QR
              </button>
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
