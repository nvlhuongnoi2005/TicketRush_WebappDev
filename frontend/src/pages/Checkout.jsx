import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ordersApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()

  const eventId = location.state?.eventId
  const eventTitle = location.state?.eventTitle || 'Event'
  const seats = location.state?.seats || []

  const [order, setOrder] = useState(null)
  const [qrInfo, setQrInfo] = useState(null)
  const [placing, setPlacing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState('')
  const placingRef = useRef(false)

  if (!user) {
    navigate('/login', { replace: true })
    return null
  }

  if (!seats.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-white md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-semibold">Checkout not available</h1>
          <p className="mt-3 text-slate-400">Please select seats first.</p>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const totalAmount = order?.total_amount ?? seats.reduce((s, seat) => s + (seat.price || 0), 0)
  const items = order?.items ?? seats.map((s) => ({
    seat_id: s.id,
    seat_label: s.label,
    section_name: s.sectionName || s.section_name,
    price: s.price,
  }))

  const handlePlaceOrder = async () => {
    if (order || placingRef.current) return
    placingRef.current = true
    setPlacing(true)
    setError('')
    try {
      const seatIds = seats.map((s) => s.id)
      const newOrder = await ordersApi.create({ seat_ids: seatIds, event_id: eventId ?? null })
      setOrder(newOrder)
      try {
        const qr = await ordersApi.paymentQr(newOrder.id)
        setQrInfo(qr)
      } catch {}
    } catch (err) {
      setError(err.message || 'Could not create order. Please try again.')
    } finally {
      placingRef.current = false
      setPlacing(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!order) return
    setConfirming(true)
    setError('')
    try {
      await ordersApi.confirm(order.id)
      navigate('/tickets', { state: { message: 'Ticket purchase successful!' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Checkout</p>
          <h1 className="text-3xl font-semibold">Complete your order</h1>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left: items + QR */}
          <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Order summary</h2>
            {order?.id && <p className="text-sm text-slate-400">Order #{order.id}</p>}

            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={item.seat_id ?? idx} className="rounded-2xl border border-white/10 bg-slate-950 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{item.seat_label}</p>
                      <p className="text-sm text-slate-400">{item.section_name || eventTitle}</p>
                    </div>
                    <p className="font-semibold">{(item.price || 0).toLocaleString()} VND</p>
                  </div>
                </div>
              ))}
            </div>

            {qrInfo && (
              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.15em] text-cyan-200">Bank transfer QR</h3>
                <div className="flex flex-wrap items-start gap-5">
                  <img src={qrInfo.qr_url} alt="Payment QR" className="h-40 w-40 rounded-xl bg-white p-1" />
                  <div className="space-y-1 text-sm text-slate-300">
                    <p>Bank: <span className="font-medium text-white">{qrInfo.bank_id}</span></p>
                    <p>Account: <span className="font-medium text-white">{qrInfo.account_no}</span></p>
                    <p>Name: <span className="font-medium text-white">{qrInfo.account_name}</span></p>
                    <p>Amount: <span className="font-semibold text-cyan-300">{Number(qrInfo.amount).toLocaleString()} VND</span></p>
                    <p className="font-mono text-xs text-slate-400">{qrInfo.description}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-400">Scan the QR code with your banking app, then click Confirm Payment.</p>
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <aside className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="rounded-2xl bg-slate-950 p-4">
              <p className="text-sm text-slate-400">Total amount</p>
              <p className="text-3xl font-semibold text-cyan-300">{totalAmount.toLocaleString()} VND</p>
            </div>

            <div className="space-y-2 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
              <h3 className="font-semibold text-white">Buyer information</h3>
              <p>{user.full_name || user.username}</p>
              <p>{user.email}</p>
            </div>

            <div className="grid gap-3">
              {!order ? (
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  disabled={placing}
                  className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
                >
                  {placing ? 'Placing order...' : `Place order (${seats.length} seat${seats.length > 1 ? 's' : ''})`}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  disabled={confirming}
                  className="rounded-full bg-emerald-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-50"
                >
                  {confirming ? 'Confirming...' : 'Confirm payment'}
                </button>
              )}
              <Link to="/tickets" className="rounded-full border border-white/15 px-5 py-3 text-center font-semibold text-white transition hover:bg-white/10">
                Go to my tickets
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default Checkout
