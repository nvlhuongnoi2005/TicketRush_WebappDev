import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getEventById } from '../lib/eventStorage'
import { createTicketsForOrder, saveOrder, saveExtraTickets, updateOrderStatus } from '../lib/ticketStorage'

function Checkout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const event = getEventById(location.state?.eventId || 1)
  const seats = location.state?.seats || []
  const totalAmount = location.state?.totalAmount || seats.reduce((sum, seat) => sum + seat.price, 0)

  const [buyerName, setBuyerName] = useState(user?.full_name || '')
  const [buyerEmail, setBuyerEmail] = useState(user?.email || '')
  const [order, setOrder] = useState(null)
  const [message, setMessage] = useState('')
  const [lockExpiresAt, setLockExpiresAt] = useState(null)
  const [lockedSeatIds, setLockedSeatIds] = useState([])
  const [now, setNow] = useState(Date.now())
  const [isPaid, setIsPaid] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setBuyerName(user.full_name || '')
      setBuyerEmail(user.email || '')
    }
  }, [user])

  // Restore lock info from localStorage (set by SeatMap)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('seatLock')
      if (!raw) return
      const data = JSON.parse(raw)
      if (data && data.eventId === event?.id) {
        setLockedSeatIds(data.lockedSeatIds || [])
        setLockExpiresAt(data.expiresAt || null)
      }
    } catch (err) {
      // ignore
    }
  }, [event])

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Release seat lock if user leaves checkout without paying
  useEffect(() => {
    return () => {
      if (!isPaid) {
        try {
          localStorage.removeItem('seatLock')
        } catch (err) {}
      }
    }
  }, [isPaid])

  useEffect(() => {
    if (!lockExpiresAt) return
    const remaining = lockExpiresAt - Date.now()
    if (remaining <= 0) {
      // lock expired
      try { localStorage.removeItem('seatLock') } catch (err) {}
      setLockedSeatIds([])
      setLockExpiresAt(null)
      setMessage('Seat lock expired — seats were released.')
      // go back to seat map
      setTimeout(() => navigate(`/seat-map/${event.id}`), 1200)
    }
  }, [now, lockExpiresAt, event, navigate])

  const formatDuration = (ms) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const summaryItems = useMemo(() => {
    return seats.map((seat) => ({
      ...seat,
      sectionName: event?.sections.find((section) => section.price === seat.price)?.name || 'General',
    }))
  }, [event, seats])

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-slate-900 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Checkout not available</h1>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-sky-500 px-4 py-2 font-semibold text-white">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  // Note: orders are created and finalized in `handleConfirmPayment`.

  const handleConfirmPayment = () => {
    const baseOrder = order || {
      id: Date.now(),
      event_id: event.id,
      user_id: user?.id || null,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      total_amount: totalAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      items: summaryItems.map((seat) => ({
        seat_id: seat.id,
        seat_label: seat.label,
        price: seat.price,
      })),
    }

    saveOrder(baseOrder)
    const paidOrder = updateOrderStatus(baseOrder.id, 'paid') || { ...baseOrder, status: 'paid' }
    const createdTickets = createTicketsForOrder({ order: paidOrder, event, seats: summaryItems, user })
    saveExtraTickets(createdTickets)

    setIsPaid(true)
    setMessage('Ticket registration successful.')
    setShowSuccess(true)
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Checkout</p>
          <h1 className="text-3xl font-semibold">Complete your order</h1>
        </div>

        {message && (
          <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-xl font-semibold">Order summary</h2>
            <div className="space-y-3">
              {summaryItems.length ? (
                summaryItems.map((seat) => (
                  <div key={seat.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{seat.label}</p>
                        <p className="text-sm text-slate-600">{event?.title}</p>
                      </div>
                      <p className="font-semibold">{seat.price.toLocaleString()} VND</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  No seat data received. Please return to the seat map.
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Total amount</p>
              <p className="text-3xl font-semibold text-sky-700">{totalAmount.toLocaleString()} VND</p>
            </div>

            {lockExpiresAt && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="text-slate-500">Lock timer</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{formatDuration(lockExpiresAt - now)}</p>
                <p className="text-xs text-slate-500">Seats will be released when the timer reaches 00:00.</p>
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold">Buyer information</h3>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
                <input
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Email</label>
                <input
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400"
              >
                Confirm payment
              </button>
              <Link to="/tickets" className="rounded-full border border-slate-200 px-5 py-3 text-center font-semibold text-slate-900">
                Go to my tickets
              </Link>
            </div>
          </aside>
        </div>
      </section>
      {showSuccess && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
            <h3 className="text-xl font-semibold mb-3">Ticket purchase successful</h3>
            <p className="mb-4 text-sm text-slate-600">Thank you for your purchase. You can view your tickets in the Tickets section.</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSuccess(false)
                  navigate('/')
                }}
                className="flex-1 rounded-full border border-slate-200 px-4 py-2 text-center font-semibold text-slate-900"
              >
                Done
              </button>
              <button
                onClick={() => navigate('/tickets')}
                className="flex-1 rounded-full bg-sky-500 px-4 py-2 font-semibold text-white"
              >
                Go to my tickets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Checkout
