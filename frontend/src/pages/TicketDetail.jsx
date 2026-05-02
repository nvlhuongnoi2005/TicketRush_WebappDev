import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CFG = {
  valid: { label: 'Hợp lệ', dot: 'bg-emerald-400', badge: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-400' },
  used: { label: 'Đã dùng', dot: 'bg-slate-400', badge: 'border-slate-400/25 bg-slate-400/10 text-slate-400' },
  cancelled: { label: 'Đã hủy', dot: 'bg-rose-400', badge: 'border-rose-400/25 bg-rose-400/10 text-rose-400' },
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconBack() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M10 3L5 8l5 5" />
    </svg>
  )
}
function IconDownload() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M8 3v7M5 7l3 3 3-3" /><path d="M3 12h10" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60">
      <rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" />
    </svg>
  )
}
function IconPin() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60">
      <path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" />
      <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" />
    </svg>
  )
}
function IconSeat() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60">
      <path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" />
    </svg>
  )
}
function IconHash() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60">
      <path d="M3 6h10M3 10h10M6 3l-1 10M11 3l-1 10" />
    </svg>
  )
}
function IconPrice() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 opacity-60">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4.5v1.25M8 10.25V11.5M6 6.5h2.5a1.5 1.5 0 0 1 0 3H6" />
    </svg>
  )
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, highlight, isDark }) {
  return (
    <div className={`flex items-center justify-between gap-4 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'} border-b last:border-0`}>
      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        {icon}
        {label}
      </div>
      <span className={`text-right text-sm font-medium ${highlight
        ? isDark ? 'text-sky-400' : 'text-sky-600'
        : isDark ? 'text-slate-200' : 'text-slate-800'
        }`}>
        {value}
      </span>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function DetailSkeleton({ isDark }) {
  const b = isDark ? 'bg-slate-800' : 'bg-slate-100'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <div className={`rounded-2xl border p-8 flex flex-col items-center gap-5 ${card}`}>
        <div className={`h-52 w-52 animate-pulse rounded-2xl ${b}`} />
        <div className={`h-3 w-40 animate-pulse rounded-full ${b}`} />
        <div className={`h-9 w-32 animate-pulse rounded-xl ${b}`} />
      </div>
      <div className={`rounded-2xl border p-6 space-y-5 ${card}`}>
        <div className={`h-5 w-48 animate-pulse rounded-full ${b}`} />
        <div className={`h-7 w-3/4 animate-pulse rounded-full ${b}`} />
        <div className="space-y-3 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`h-4 animate-pulse rounded-full ${b}`} style={{ width: `${60 + i * 7}%` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
function TicketDetail() {
  const { ticketId } = useParams()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/', { replace: true }); return }
    setLoading(true)
    ticketsApi.get(ticketId)
      .then(setTicket)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, authLoading, ticketId])

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = ticket.qr_image_url
    link.download = `${ticket.qr_data || `ticket-${ticket.id}`}.png`
    link.click()
    setDownloaded(true)
    setTimeout(() => setDownloaded(false), 2000)
  }

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'

  return (
    <div className={`min-h-screen ${bg}`}>
      <section className="mx-auto max-w-7xl px-6 py-10 md:px-8">

        {/* Back link */}
        <Link
          to="/tickets"
          className={`mb-8 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition ${isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
        >
          <IconBack />
          Vé của tôi
        </Link>

        {/* Loading */}
        {loading && (
          <DetailSkeleton isDark={isDark} />
        )}

        {/* Error */}
        {!loading && (error || !ticket) && (
          <div className={`rounded-2xl border p-10 text-center ${card}`}>
            <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="opacity-40">
                <circle cx="12" cy="12" r="9" /><path d="M12 8v5M12 15.5v.5" />
              </svg>
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Không tìm thấy vé</h2>
            <p className={`mt-1 text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              {error || 'Vé không tồn tại hoặc bạn không có quyền xem.'}
            </p>
            <Link
              to="/tickets"
              className="mt-6 inline-flex rounded-full bg-sky-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
              Quay lại danh sách
            </Link>
          </div>
        )}

        {/* Detail */}
        {!loading && ticket && (
          <div className="grid gap-6 lg:grid-cols-[360px_1fr]">

            {/* ── QR panel ── */}
            <div className={`flex flex-col items-center overflow-hidden rounded-2xl border ${card}`}>
              {/* Accent bar */}
              <div className={`h-1.5 w-full ${ticket.status === 'valid' ? 'bg-gradient-to-r from-sky-500 to-indigo-500' :
                ticket.status === 'cancelled' ? 'bg-rose-400/60' : 'bg-slate-400/40'
                }`} />

              <div className="flex flex-1 flex-col items-center justify-center px-8 py-10 text-center">
                {/* Event name above QR */}
                <p className={`mb-6 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  {ticket.event_title}
                </p>

                {ticket.qr_image_url ? (
                  <div className={`rounded-2xl p-3 ${ticket.status !== 'valid'
                    ? isDark ? 'bg-slate-800' : 'bg-slate-100'
                    : 'bg-white shadow-lg shadow-slate-200/60'
                    }`}>
                    <img
                      src={ticket.qr_image_url}
                      alt="QR code"
                      className={`h-48 w-48 rounded-xl object-contain ${ticket.status !== 'valid' ? 'grayscale opacity-60' : ''}`}
                    />
                  </div>
                ) : (
                  <div className={`flex h-48 w-48 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.2" className="opacity-20">
                      <rect x="4" y="4" width="14" height="14" rx="2" />
                      <rect x="22" y="4" width="14" height="14" rx="2" />
                      <rect x="4" y="22" width="14" height="14" rx="2" />
                      <path d="M22 22h4v4h-4zM30 22v4M22 30h8v4M36 30v6" />
                    </svg>
                  </div>
                )}

                <p className={`mt-5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {ticket.status === 'valid'
                    ? 'Xuất trình mã QR tại cổng vào'
                    : ticket.status === 'used' ? 'Vé đã được sử dụng'
                      : 'Vé đã bị hủy'}
                </p>

                {ticket.qr_data && (
                  <p className={`mt-1.5 font-mono text-xs tracking-wider ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>
                    {ticket.qr_data}
                  </p>
                )}

                {ticket.qr_image_url && ticket.status === 'valid' && (
                  <button
                    onClick={handleDownload}
                    className={`mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${downloaded
                      ? isDark ? 'bg-emerald-900/60 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
                      : 'bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-md shadow-sky-500/20 hover:opacity-90'
                      }`}
                  >
                    {downloaded ? (
                      <>
                        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M3 8l3.5 3.5L13 5" />
                        </svg>
                        Đã lưu!
                      </>
                    ) : (
                      <>
                        <IconDownload />
                        Tải QR về máy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* ── Info panel ── */}
            <div className={`rounded-2xl border ${card}`}>
              {/* Header */}
              <div className={`border-b p-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-sky-500">
                        <path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" />
                        <path d="M7 3v10" strokeDasharray="2 2" />
                      </svg>
                      <span className={`text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                        Chi tiết vé
                      </span>
                    </div>
                    <h1 className={`text-xl font-bold leading-snug ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                      {ticket.event_title}
                    </h1>
                  </div>
                  {(() => {
                    const cfg = STATUS_CFG[ticket.status] ?? STATUS_CFG.valid
                    return (
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${cfg.badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                        {cfg.label}
                      </span>
                    )
                  })()}
                </div>
              </div>

              {/* Info rows */}
              <div className="p-6">
                <div className={`rounded-xl border ${isDark ? 'border-slate-800 bg-slate-950/50' : 'border-slate-100 bg-slate-50'} px-4`}>
                  {ticket.qr_data && (
                    <InfoRow
                      icon={<IconHash />}
                      label="Mã vé"
                      value={<span className="font-mono text-xs">{ticket.qr_data}</span>}
                      isDark={isDark}
                    />
                  )}
                  {ticket.event_date && (
                    <InfoRow
                      icon={<IconCalendar />}
                      label="Ngày diễn"
                      value={new Date(ticket.event_date).toLocaleString('vi-VN', {
                        weekday: 'long', day: '2-digit', month: 'long',
                        year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                      isDark={isDark}
                    />
                  )}
                  {ticket.venue_name && (
                    <InfoRow icon={<IconPin />} label="Địa điểm" value={ticket.venue_name} isDark={isDark} />
                  )}
                  {ticket.section_name && (
                    <InfoRow icon={<IconSeat />} label="Khu vực" value={ticket.section_name} isDark={isDark} />
                  )}
                  {ticket.seat_label && (
                    <InfoRow icon={<IconSeat />} label="Ghế" value={ticket.seat_label} isDark={isDark} />
                  )}
                  <InfoRow
                    icon={<IconPrice />}
                    label="Giá vé"
                    value={`${Number(ticket.price || 0).toLocaleString('vi-VN')} ₫`}
                    highlight
                    isDark={isDark}
                  />
                </div>

                {/* Share / actions */}
                {/* <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/tickets"
                    className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${isDark
                      ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M9 2L4 7l5 5" />
                    </svg>
                    Tất cả vé
                  </Link>
                </div> */}
              </div>
            </div>

          </div>
        )}
      </section>
    </div>
  )
}

export default TicketDetail