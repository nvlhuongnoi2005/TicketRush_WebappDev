import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ordersApi, seatsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const toUtcMs = (dateStr) => {
  if (!dateStr) return null
  const s = String(dateStr)
  return new Date(s.match(/[Z+]/) ? s : s + 'Z').getTime()
}

function formatDuration(ms) {
  const secs = Math.max(Math.floor(ms / 1000), 0)
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()

  // State passed from SeatMap
  const seatIds = location.state?.seatIds ?? []
  const eventTitle = location.state?.eventTitle ?? ''

  const [order, setOrder] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Refs để cleanup effect có thể đọc giá trị mới nhất mà không cần deps
  const doneRef = useRef(false)
  const orderRef = useRef(null)
  const abandonCalledRef = useRef(false)

  // Sync refs với state để cleanup luôn có giá trị mới nhất
  useEffect(() => { doneRef.current = done }, [done])
  useEffect(() => { orderRef.current = order }, [order])

  // Gọi abandon khi rời trang (cả navigate trong SPA lẫn đóng tab)
  useEffect(() => {
    return () => {
      if (doneRef.current || abandonCalledRef.current) return
      const currentOrder = orderRef.current
      if (!currentOrder?.id) return
      abandonCalledRef.current = true
      const token = localStorage.getItem('ticketrush_token')
      // keepalive: true đảm bảo request hoàn thành kể cả khi tab bị đóng
      fetch(`/api/orders/${currentOrder.id}/abandon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => { })
    }
  }, [])

  // 1s clock
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Create order on mount
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }
    if (!seatIds.length) { navigate('/'); return }

    ordersApi.create({ seat_ids: seatIds })
      .then(async (ord) => {
        setOrder(ord)
        try {
          const qr = await ordersApi.paymentQr(ord.id)
          setQrData(qr)
        } catch (e) {
          // QR fetch failure is non-fatal
          console.error('QR fetch error:', e)
        }
      })
      .catch(async (e) => {
        // Release the locks so seats aren't stranded until expiry
        await Promise.allSettled(seatIds.map((id) => seatsApi.unlock(id)))
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [user, authLoading, seatIds.join(',')])

  // Lock expiry countdown - redirect back if expired
  const expiresMs = toUtcMs(order?.expires_at)
  const remaining = expiresMs ? expiresMs - now : null

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !done) {
      setError('Đơn hàng đã hết hạn. Ghế đã được giải phóng. Vui lòng chọn lại.')
      setTimeout(() => navigate(-1), 2500)
    }
  }, [remaining, done, navigate])

  const handleConfirm = async () => {
    if (!order) return
    setConfirming(true)
    setError('')
    try {
      await ordersApi.confirm(order.id)
      setDone(true)
    } catch (e) {
      setError(e.message)
    } finally {
      setConfirming(false)
    }
  }

  const bg = isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
  const card = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
  const sub = isDark ? 'text-slate-400' : 'text-slate-600'
  const inner = isDark ? 'border-white/10 bg-slate-900' : 'border-slate-200 bg-slate-50'

  if (loading) {
    return (
      <div className={`${bg} py-16 text-center`}>
        <p className={sub}>Đang tạo đơn hàng...</p>
      </div>
    )
  }

  if (done) {
    return (
      <div className={`${bg} flex min-h-[60vh] items-center justify-center px-4`}>
        <div className={`w-full max-w-md rounded-3xl border p-8 text-center ${card}`}>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/15 text-4xl">✓</div>
          <h2 className="text-2xl font-semibold text-emerald-400">Mua vé thành công!</h2>
          <p className={`mt-2 text-sm ${sub}`}>Vé của bạn đã được phát hành và có thể xem tại mục "Vé của tôi".</p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigate('/tickets', { state: { message: 'Mua vé thành công! Vé của bạn đã được phát hành.' } })}
              className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Xem vé của tôi
            </button>
            <Link to="/home" className={`rounded-full border px-5 py-3 text-sm font-medium ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}>
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (error && !order) {
    return (
      <div className={`${bg} mx-auto max-w-7xl px-4 py-16 md:px-8`}>
        <div className={`rounded-3xl border p-8 ${card}`}>
          <h1 className="text-2xl font-semibold">Lỗi tạo đơn hàng</h1>
          <p className={`mt-2 ${sub}`}>{error}</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-flex rounded-full bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white">
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={bg}>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-500">Thanh toán</p>
          <h1 className="text-3xl font-semibold">Hoàn tất đơn hàng</h1>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-400">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Order summary */}
          <div className={`rounded-3xl border p-5 ${card}`}>
            <h2 className="mb-4 text-xl font-semibold">Chi tiết đơn hàng #{order?.id}</h2>
            <div className="space-y-3">
              {order?.items?.map((item) => (
                <div key={item.id} className={`flex items-center justify-between rounded-xl border p-4 ${inner}`}>
                  <div>
                    <p className="font-medium">{item.seat_label}</p>
                    <p className={`text-sm ${sub}`}>{item.section_name} · {eventTitle}</p>
                  </div>
                  <p className="font-semibold">{Number(item.price).toLocaleString()} VND</p>
                </div>
              ))}
            </div>

            {/* VietQR */}
            {qrData?.qr_url && (
              <div className="mt-5 text-center">
                <p className={`mb-3 text-sm font-medium ${sub}`}>Quét mã chuyển khoản để xác nhận</p>
                <img
                  src={qrData.qr_url}
                  alt="VietQR payment"
                  className="mx-auto h-56 w-56 rounded-2xl bg-white p-2 shadow"
                />
                <div className={`mt-3 space-y-1 rounded-xl border p-3 text-sm ${inner}`}>
                  <p><span className={sub}>Ngân hàng:</span> <span className="font-medium">{qrData.bank_id}</span></p>
                  <p><span className={sub}>Số TK:</span> <span className="font-mono font-medium">{qrData.account_no}</span></p>
                  <p><span className={sub}>Chủ TK:</span> <span className="font-medium">{qrData.account_name}</span></p>
                  <p><span className={sub}>Nội dung:</span> <span className="font-medium">{qrData.description}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4">
            {/* Total */}
            <div className={`rounded-3xl border p-5 ${card}`}>
              <p className={`text-sm ${sub}`}>Tổng tiền</p>
              <p className={`text-3xl font-semibold ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                {Number(order?.total_amount ?? 0).toLocaleString()} VND
              </p>
            </div>

            {/* Countdown */}
            {remaining !== null && remaining > 0 && (
              <div className={`rounded-3xl border p-5 ${card}`}>
                <p className={`text-sm ${sub}`}>Thời gian giữ chỗ còn lại</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${remaining < 60000 ? 'text-rose-400' : isDark ? 'text-amber-300' : 'text-amber-600'}`}>
                  {formatDuration(remaining)}
                </p>
                <p className={`mt-1 text-xs ${sub}`}>Ghế sẽ được giải phóng khi hết giờ.</p>
              </div>
            )}

            {/* Buyer info */}
            <div className={`rounded-3xl border p-5 ${card}`}>
              <h3 className="mb-3 font-semibold">Thông tin người mua</h3>
              <div className={`space-y-1 text-sm ${sub}`}>
                <p>Tên: <span className="font-medium">{user?.full_name}</span></p>
                <p>Email: <span className="font-medium">{user?.email}</span></p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={handleConfirm}
                disabled={confirming || (remaining !== null && remaining <= 0)}
                className="w-full rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {confirming ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
              </button>
              <p className={`text-center text-xs ${sub}`}>
                Nhấn xác nhận sau khi đã chuyển khoản thành công.
              </p>
              <Link
                to="/tickets"
                className={`block rounded-full border px-5 py-3 text-center text-sm font-semibold transition ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
              >
                Xem vé của tôi
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default Checkout
