import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

function TicketDetail() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    ticketsApi.get(ticketId)
      .then(setTicket)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, ticketId])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = ticket.qr_image_url
    link.download = `${ticket.qr_data || `ticket-${ticket.id}`}.png`
    link.click()
  }

  if (loading) {
    return (
      <div className="py-16 text-center text-slate-400">Đang tải vé...</div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-white md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-semibold">Không tìm thấy vé</h1>
          <p className="mt-2 text-slate-400">{error || 'Vé không tồn tại hoặc đã bị xóa.'}</p>
          <Link to="/tickets" className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950">
            Quay lại vé của tôi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* QR */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center">
            {ticket.qr_image_url ? (
              <img
                src={ticket.qr_image_url}
                alt={ticket.qr_data}
                className="mx-auto h-64 w-64 rounded-2xl bg-white p-2"
              />
            ) : (
              <div className="mx-auto flex h-64 w-64 items-center justify-center rounded-2xl bg-white/10 text-slate-400">
                No QR
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">Quét mã QR tại cổng vào sự kiện</p>
            {ticket.qr_image_url && (
              <button
                onClick={handleDownload}
                className="mt-4 rounded-full bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Tải QR về máy
              </button>
            )}
          </div>

          {/* Info */}
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Chi tiết vé</p>
              <h1 className="mt-1 text-3xl font-semibold">{ticket.event_title}</h1>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-900 p-4 text-sm">
              {ticket.qr_data && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Mã vé</span>
                  <span className="font-mono font-medium">{ticket.qr_data}</span>
                </div>
              )}
              {ticket.event_date && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Ngày diễn</span>
                  <span>{new Date(ticket.event_date).toLocaleString('vi-VN')}</span>
                </div>
              )}
              {ticket.venue_name && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Địa điểm</span>
                  <span>{ticket.venue_name}</span>
                </div>
              )}
              {ticket.section_name && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Khu vực</span>
                  <span>{ticket.section_name}</span>
                </div>
              )}
              {ticket.seat_label && (
                <div className="flex justify-between gap-3">
                  <span className="text-slate-400">Ghế</span>
                  <span className="font-medium">{ticket.seat_label}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Giá vé</span>
                <span className="font-semibold text-cyan-300">{Number(ticket.price || 0).toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-400">Trạng thái</span>
                <span className={ticket.status === 'valid' ? 'text-emerald-400' : 'text-slate-400'}>
                  {ticket.status || 'valid'}
                </span>
              </div>
            </div>

            <Link
              to="/tickets"
              className="inline-flex rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Quay lại danh sách vé
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TicketDetail
