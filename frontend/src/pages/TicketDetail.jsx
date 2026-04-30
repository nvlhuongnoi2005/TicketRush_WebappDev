import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function TicketDetail() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }
    setLoading(true)
    ticketsApi.get(ticketId)
      .then(setTicket)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, authLoading, ticketId])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = ticket.qr_image_url
    link.download = `${ticket.qr_data || `ticket-${ticket.id}`}.png`
    link.click()
  }

  const bg = isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
  const card = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
  const infoCard = isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-50'
  const subText = isDark ? 'text-slate-400' : 'text-slate-500'

  if (loading) {
    return (
      <div className={`py-16 text-center ${subText}`}>Đang tải vé...</div>
    )
  }

  if (error || !ticket) {
    return (
      <div className={`mx-auto max-w-7xl px-4 py-16 md:px-8 ${bg}`}>
        <div className={`rounded-3xl border p-8 ${card}`}>
          <h1 className="text-3xl font-semibold">Không tìm thấy vé</h1>
          <p className={`mt-2 ${subText}`}>{error || 'Vé không tồn tại hoặc đã bị xóa.'}</p>
          <Link to="/tickets" className="mt-6 inline-flex rounded-full bg-cyan-400 px-5 py-2.5 font-semibold text-slate-950">
            Quay lại vé của tôi
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={bg}>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* QR */}
          <div className={`rounded-3xl border p-6 text-center ${card}`}>
            {ticket.qr_image_url ? (
              <img
                src={ticket.qr_image_url}
                alt={ticket.qr_data}
                className="mx-auto h-64 w-64 rounded-2xl bg-white p-2"
              />
            ) : (
              <div className={`mx-auto flex h-64 w-64 items-center justify-center rounded-2xl ${isDark ? 'bg-white/10' : 'bg-slate-200'} ${subText}`}>
                No QR
              </div>
            )}
            <p className={`mt-4 text-xs ${subText}`}>Quét mã QR tại cổng vào sự kiện</p>
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
          <div className={`space-y-5 rounded-3xl border p-6 ${card}`}>
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-cyan-500">Chi tiết vé</p>
              <h1 className="mt-1 text-3xl font-semibold">{ticket.event_title}</h1>
            </div>

            <div className={`space-y-2 rounded-2xl border p-4 text-sm ${infoCard}`}>
              {ticket.qr_data && (
                <div className="flex justify-between gap-3">
                  <span className={subText}>Mã vé</span>
                  <span className="font-mono font-medium">{ticket.qr_data}</span>
                </div>
              )}
              {ticket.event_date && (
                <div className="flex justify-between gap-3">
                  <span className={subText}>Ngày diễn</span>
                  <span>{new Date(ticket.event_date).toLocaleString('vi-VN')}</span>
                </div>
              )}
              {ticket.venue_name && (
                <div className="flex justify-between gap-3">
                  <span className={subText}>Địa điểm</span>
                  <span>{ticket.venue_name}</span>
                </div>
              )}
              {ticket.section_name && (
                <div className="flex justify-between gap-3">
                  <span className={subText}>Khu vực</span>
                  <span>{ticket.section_name}</span>
                </div>
              )}
              {ticket.seat_label && (
                <div className="flex justify-between gap-3">
                  <span className={subText}>Ghế</span>
                  <span className="font-medium">{ticket.seat_label}</span>
                </div>
              )}
              <div className="flex justify-between gap-3">
                <span className={subText}>Giá vé</span>
                <span className="font-semibold text-cyan-500">{Number(ticket.price || 0).toLocaleString()} VND</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className={subText}>Trạng thái</span>
                <span className={ticket.status === 'valid' ? 'text-emerald-400' : subText}>
                  {ticket.status || 'valid'}
                </span>
              </div>
            </div>

            <Link
              to="/tickets"
              className={`inline-flex rounded-full border px-5 py-2.5 text-sm font-semibold transition ${isDark ? 'border-white/15 text-white hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
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
