import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ordersApi, seatsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// ─── Helpers ───────────────────────────────────────────────────────────────────
const toUtcMs = (dateStr) => {
  if (!dateStr) return null
  const s = String(dateStr)
  return new Date(s.match(/[Z+]/) ? s : s + 'Z').getTime()
}
function formatDuration(ms) {
  const secs = Math.max(Math.floor(ms / 1000), 0)
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

// ─── CSS ───────────────────────────────────────────────────────────────────────
const CSS = `
@keyframes fadeUp {
  from { opacity:0; transform:translateY(16px); }
  to   { opacity:1; transform:translateY(0); }
}
@keyframes checkDraw {
  from { stroke-dashoffset: 60; }
  to   { stroke-dashoffset: 0; }
}
@keyframes ripple {
  0%   { transform:scale(1);   opacity:0.6; }
  100% { transform:scale(2.2); opacity:0; }
}
@keyframes spin {
  to { transform:rotate(360deg); }
}
@keyframes shimmerBar {
  0%   { background-position:-200% center; }
  100% { background-position: 200% center; }
}
@keyframes timerWarn {
  0%,100% { opacity:1; }
  50%      { opacity:0.55; }
}
@keyframes countdownRing {
  from { stroke-dashoffset: 0; }
}
.fade-up      { animation: fadeUp 0.45s cubic-bezier(.22,1,.36,1) both; }
.check-draw   { stroke-dasharray:60; animation: checkDraw 0.55s cubic-bezier(.22,1,.36,1) 0.2s both; }
.ripple-ring  { animation: ripple 1.6s ease-out infinite; }
.spin         { animation: spin 1s linear infinite; }
.shimmer-btn  {
  background: linear-gradient(90deg,#0ea5e9 0%,#6366f1 50%,#0ea5e9 100%);
  background-size:200%;
  animation: shimmerBar 2.5s linear infinite;
}
.timer-warn   { animation: timerWarn 1s ease-in-out infinite; }
`

// ─── Icons ─────────────────────────────────────────────────────────────────────
function IconBack() {
  return <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 3L5 8l5 5" /></svg>
}
function IconTicket() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M2 9a1 1 0 0 1 0-2V6h20v1a1 1 0 0 1 0 2v1a1 1 0 0 1 0 2v1H2v-1a1 1 0 0 1 0-2V9Z" /><line x1="9" y1="6" x2="9" y2="18" strokeDasharray="2 2" /></svg>
}
function IconUser() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
}
function IconClock() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
}
function IconRefresh() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8" /><path d="M3 3v5h5" /></svg>
}
function IconCopy() {
  return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
}
function IconCheck({ className = '' }) {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}><path d="M5 12l5 5L20 7" /></svg>
}
function IconAlert() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></svg>
}

// ─── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <button onClick={handle}
      className={`ml-1.5 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition ${copied ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-200/70 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
        }`}>
      {copied ? <><IconCheck /> Đã sao chép</> : <><IconCopy /> Sao chép</>}
    </button>
  )
}

// ─── Countdown ring ────────────────────────────────────────────────────────────
function CountdownRing({ remaining, total, isDark }) {
  const r = 30, circ = 2 * Math.PI * r
  const pct = Math.max(0, Math.min(remaining / total, 1))
  const dash = circ * pct
  const isWarn = remaining < 60000

  return (
    <div className="relative flex items-center justify-center">
      <svg width="76" height="76" viewBox="0 0 76 76" className="-rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke={isDark ? '#1e293b' : '#f1f5f9'} strokeWidth="5" />
        <circle cx="38" cy="38" r={r} fill="none"
          stroke={isWarn ? '#f43f5e' : '#f59e0b'}
          strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-1000 ease-linear"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-base font-extrabold tabular-nums leading-none ${isWarn ? 'text-rose-400 timer-warn' : isDark ? 'text-amber-300' : 'text-amber-600'}`}>
          {formatDuration(remaining)}
        </span>
        <span className={`mt-0.5 text-[9px] font-medium uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>còn lại</span>
      </div>
    </div>
  )
}

// ─── Payment status states ─────────────────────────────────────────────────────
// idle → waiting (after QR shown) → polling → paid | expired

function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()

  const seatIds = location.state?.seatIds ?? []
  const eventTitle = location.state?.eventTitle ?? ''

  const [order, setOrder] = useState(null)
  const [qrData, setQrData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentState, setPaymentState] = useState('idle') // idle | waiting | polling | paid | expired
  const [pollCount, setPollCount] = useState(0)
  const [now, setNow] = useState(Date.now())

  const doneRef = useRef(false)
  const orderRef = useRef(null)
  const abandonCalledRef = useRef(false)
  const pollRef = useRef(null)

  useEffect(() => { doneRef.current = paymentState === 'paid' }, [paymentState])
  useEffect(() => { orderRef.current = order }, [order])

  // Abandon on unmount
  useEffect(() => {
    return () => {
      if (doneRef.current || abandonCalledRef.current) return
      const o = orderRef.current
      if (!o?.id) return
      abandonCalledRef.current = true
      const token = localStorage.getItem('ticketrush_token')
      fetch(`/api/orders/${o.id}/abandon`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => { })
    }
  }, [])

  // 1-second clock
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Create order
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/', { replace: true }); return }
    if (!seatIds.length) { navigate('/'); return }

    ordersApi.create({ seat_ids: seatIds })
      .then(async (ord) => {
        setOrder(ord)
        try { setQrData(await ordersApi.paymentQr(ord.id)) }
        catch (e) { console.error('QR error:', e) }
        setPaymentState('waiting')
      })
      .catch(async (e) => {
        await Promise.allSettled(seatIds.map(id => seatsApi.unlock(id)))
        setError(e.message)
      })
      .finally(() => setLoading(false))
  }, [user, authLoading, seatIds.join(',')])

  // [DEMO] Xác nhận ngay: gọi confirm → chờ 2s → chuyển màn thành công
  const startPolling = useCallback(async () => {
    if (!order?.id || paymentState === 'polling') return
    setPaymentState('polling')
    try { await ordersApi.confirm(order.id) } catch (e) { console.error('confirm error:', e) }
    setTimeout(() => { doneRef.current = true; setPaymentState('paid') }, 2000)
  }, [order?.id, paymentState])

  const stopPolling = () => { setPaymentState('waiting') }

  // [PRODUCTION] Poll backend mỗi 4 giây chờ webhook/bank xác nhận
  // const startPolling = useCallback(() => {
  //   if (!order?.id || pollRef.current) return
  //   setPaymentState('polling')
  //   setPollCount(0)
  //   pollRef.current = setInterval(async () => {
  //     try {
  //       const fresh = await ordersApi.get(order.id)
  //       setPollCount(c => c + 1)
  //       if (fresh.status === 'paid') {
  //         clearInterval(pollRef.current); pollRef.current = null
  //         setOrder(fresh); setPaymentState('paid')
  //       }
  //     } catch (e) { console.error('poll error:', e) }
  //   }, 4000)
  // }, [order?.id])
  //
  // const stopPolling = () => {
  //   if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  //   setPaymentState('waiting')
  // }

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current) }, [])

  // Expiry
  const expiresMs = toUtcMs(order?.expires_at)
  const TOTAL_HOLD = 10 * 60 * 1000 // assume 10 min hold
  const remaining = expiresMs ? Math.max(0, expiresMs - now) : null

  useEffect(() => {
    if (remaining !== null && remaining <= 0 && paymentState !== 'paid') {
      stopPolling(); setPaymentState('expired')
      setTimeout(() => navigate(-1), 3000)
    }
  }, [remaining, paymentState])

  // ── Theme tokens ──────────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  const inner = isDark ? 'border-slate-700/60 bg-slate-800/60' : 'border-slate-100 bg-slate-50'
  const muted = isDark ? 'text-slate-500' : 'text-slate-400'
  const sub = isDark ? 'text-slate-400' : 'text-slate-500'

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={`${bg} flex min-h-[60vh] items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-sky-500 border-t-transparent spin" />
          <p className={`text-sm ${sub}`}>Đang tạo đơn hàng…</p>
        </div>
      </div>
    )
  }

  // ── Error (no order) ──────────────────────────────────────────────────────────
  if (error && !order) {
    return (
      <div className={`${bg} flex min-h-[60vh] items-center justify-center px-4`}>
        <div className={`w-full max-w-sm rounded-2xl border p-8 text-center ${card}`}>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10">
            <IconAlert />
          </div>
          <h2 className="text-lg font-bold">Không thể tạo đơn hàng</h2>
          <p className={`mt-2 text-sm ${sub}`}>{error}</p>
          <button onClick={() => navigate(-1)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400">
            <IconBack /> Quay lại
          </button>
        </div>
      </div>
    )
  }

  // ── Success ───────────────────────────────────────────────────────────────────
  if (paymentState === 'paid') {
    return (
      <>
        <style>{CSS}</style>
        <div className={`${bg} flex min-h-[70vh] items-center justify-center px-4`}>
          <div className={`fade-up w-full max-w-sm overflow-hidden rounded-2xl border text-center ${card}`}>
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-sky-500" />
            <div className="px-8 py-10">
              {/* success icon */}
              <div className="relative mx-auto mb-6 flex h-20 w-20 items-center justify-center">
                <div className={`absolute inset-0 rounded-full bg-emerald-400/15 ripple-ring`} />
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
                  <svg width="36" height="36" viewBox="0 0 48 48" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round">
                    <path d="M10 24l10 10 18-18" className="check-draw" />
                  </svg>
                </div>
              </div>
              <h2 className={`text-xl font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Thanh toán thành công!
              </h2>
              <p className={`mt-2 text-sm leading-relaxed ${sub}`}>
                Vé của bạn đã được phát hành.<br />Kiểm tra tại mục "Vé của tôi".
              </p>
              <div className="mt-7 space-y-2.5">
                <button
                  onClick={() => navigate('/tickets')}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition hover:opacity-90">
                  <IconTicket /> Xem vé của tôi
                </button>
                <Link to="/"
                  className={`block rounded-xl border py-3 text-sm font-medium transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  Về trang chủ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Expired ───────────────────────────────────────────────────────────────────
  if (paymentState === 'expired') {
    return (
      <>
        <style>{CSS}</style>
        <div className={`${bg} flex min-h-[60vh] items-center justify-center px-4`}>
          <div className={`fade-up w-full max-w-sm rounded-2xl border p-8 text-center ${card}`}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <IconClock />
            </div>
            <h2 className="text-lg font-bold">Đơn hàng đã hết hạn</h2>
            <p className={`mt-2 text-sm ${sub}`}>Thời gian giữ chỗ đã hết. Đang quay về trang chọn ghế…</p>
            <div className={`mt-4 flex items-center justify-center gap-2 text-xs ${muted}`}>
              <div className="h-3 w-3 rounded-full border border-slate-400 border-t-transparent spin" />
              Đang chuyển hướng…
            </div>
          </div>
        </div>
      </>
    )
  }

  // ── Checkout main ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className={`${bg} min-h-screen`}>
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">

          {/* ── Header ── */}
          <div className="fade-up mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-1 text-xs font-bold uppercase tracking-widest text-sky-500">Thanh toán</p>
              <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                Hoàn tất đơn hàng
              </h1>
              <p className={`mt-0.5 text-xs ${muted}`}>Đơn #{order?.id} · {eventTitle}</p>
            </div>
            <button onClick={() => navigate(-1)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-white'}`}>
              <IconBack /> Quay lại
            </button>
          </div>

          {/* error */}
          {error && (
            <div className="fade-up mb-5 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/8 px-4 py-3">
              <IconAlert />
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[1fr_340px]">

            {/* ══ LEFT: QR + order items ══ */}
            <div className="space-y-5">

              {/* QR card */}
              {qrData?.qr_url && (
                <div className={`fade-up overflow-hidden rounded-2xl border ${card}`}>
                  {/* header */}
                  <div className={`border-b px-6 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                      Thanh toán chuyển khoản
                    </h2>
                    <p className={`mt-0.5 text-xs ${sub}`}>Quét mã QR bằng app ngân hàng để chuyển khoản</p>
                  </div>

                  <div className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr]">
                    {/* QR image */}
                    <div className={`mx-auto flex items-center justify-center rounded-2xl border p-3 shadow-sm ${isDark ? 'border-slate-700 bg-white' : 'border-slate-200 bg-white'}`}>
                      <img src={qrData.qr_url} alt="VietQR" className="h-44 w-44 object-contain" />
                    </div>

                    {/* Bank info */}
                    <div className="space-y-3">
                      {[
                        { label: 'Ngân hàng', value: qrData.bank_id, copy: false },
                        { label: 'Số tài khoản', value: qrData.account_no, copy: true },
                        { label: 'Chủ tài khoản', value: qrData.account_name, copy: false },
                        { label: 'Số tiền', value: `${Number(qrData.amount).toLocaleString('vi-VN')} ₫`, copy: false, highlight: true },
                        { label: 'Nội dung CK', value: qrData.description, copy: true },
                      ].map(row => (
                        <div key={row.label} className={`rounded-xl border px-3.5 py-2.5 ${inner}`}>
                          <p className={`text-[10px] font-semibold uppercase tracking-widest ${muted}`}>{row.label}</p>
                          <div className="mt-0.5 flex items-center">
                            <p className={`text-sm font-semibold ${row.highlight ? (isDark ? 'text-sky-400' : 'text-sky-600') : isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {row.value}
                            </p>
                            {row.copy && <CopyBtn text={row.value} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* step instructions */}
                  <div className={`border-t px-6 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex flex-wrap gap-4 text-xs">
                      {['Mở app ngân hàng', 'Quét mã QR hoặc nhập thủ công', 'Nhập đúng số tiền & nội dung', 'Xác nhận chuyển khoản'].map((s, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${['bg-sky-500', 'bg-indigo-500', 'bg-violet-500', 'bg-emerald-500'][i]
                            }`}>{i + 1}</span>
                          <span className={sub}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Order items */}
              <div className={`fade-up overflow-hidden rounded-2xl border ${card}`}>
                <div className={`border-b px-5 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                    Chi tiết đơn hàng
                  </h2>
                </div>
                <div className="divide-y px-5 py-1" style={{ borderColor: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9' }}>
                  {order?.items?.map(item => (
                    <div key={item.id} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          <IconTicket />
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.seat_label}</p>
                          <p className={`text-xs ${sub}`}>{item.section_name} · {eventTitle}</p>
                        </div>
                      </div>
                      <p className={`text-sm font-bold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {Number(item.price).toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  ))}
                </div>
                <div className={`border-t px-5 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`text-xs font-medium ${muted}`}>Tổng cộng</p>
                    <p className={`text-xl font-extrabold tabular-nums ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                      {Number(order?.total_amount ?? 0).toLocaleString('vi-VN')} ₫
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ══ RIGHT SIDEBAR ══ */}
            <aside className="space-y-4">

              {/* countdown */}
              {remaining !== null && remaining > 0 && (
                <div className={`fade-up overflow-hidden rounded-2xl border ${card}`}>
                  <div className={`border-b px-5 py-3.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center gap-2">
                      <IconClock />
                      <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Thời gian giữ chỗ</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-5 py-4">
                    <div>
                      <p className={`text-xs leading-relaxed ${sub}`}>
                        Ghế sẽ được<br />giải phóng sau.
                      </p>
                    </div>
                    <CountdownRing remaining={remaining} total={TOTAL_HOLD} isDark={isDark} />
                  </div>
                </div>
              )}

              {/* buyer info */}
              <div className={`fade-up rounded-2xl border ${card}`}>
                <div className={`border-b px-5 py-3.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2">
                    <IconUser />
                    <span className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Người mua</span>
                  </div>
                </div>
                <div className="space-y-2.5 px-5 py-4">
                  {[
                    { label: 'Họ tên', value: user?.full_name },
                    { label: 'Email', value: user?.email },
                  ].map(row => (
                    <div key={row.label} className={`rounded-xl border px-3 py-2 ${inner}`}>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest ${muted}`}>{row.label}</p>
                      <p className={`mt-0.5 text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className={`fade-up rounded-2xl border p-5 ${card}`}>
                {paymentState === 'polling' ? (
                  /* Polling state */
                  <div className="space-y-3 text-center">
                    <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
                      <div className="h-6 w-6 rounded-full border-2 border-sky-500 border-t-transparent spin" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        Đang kiểm tra thanh toán…
                      </p>
                      <p className={`mt-1 text-xs ${sub}`}>
                        Tự động cập nhật mỗi 4 giây
                        {pollCount > 0 && ` · đã kiểm tra ${pollCount} lần`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={stopPolling}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-semibold transition ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                        Huỷ kiểm tra
                      </button>
                      <button onClick={() => { stopPolling(); setTimeout(startPolling, 100) }}
                        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                        <IconRefresh /> Làm mới
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Waiting state */
                  <div className="space-y-3">
                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Sau khi chuyển khoản xong:
                    </p>
                    <button onClick={startPolling}
                      className="shimmer-btn flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.98]">
                      <IconCheck className="check-draw" /> Tôi đã chuyển khoản
                    </button>
                    <p className={`text-center text-[11px] leading-relaxed ${muted}`}>
                      Hệ thống sẽ tự động kiểm tra và xác nhận thanh toán.
                    </p>
                    <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    <Link to="/tickets"
                      className={`flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-xs font-semibold transition ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <IconTicket /> Xem vé của tôi
                    </Link>
                  </div>
                )}
              </div>

            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

export default Checkout