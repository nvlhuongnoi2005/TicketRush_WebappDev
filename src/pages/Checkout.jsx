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

  useEffect(() => {
    if (user) {
      setBuyerName(user.full_name || '')
      setBuyerEmail(user.email || '')
    }
  }, [user])

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

  const handleCreateOrder = () => {
    if (!seats.length) {
      setMessage('Please select seats first.')
      return
    }

    const nextOrder = {
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

    saveOrder(nextOrder)
    setOrder(nextOrder)
    setMessage('Order created. You can now confirm payment.')
  }

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

    setMessage('Ticket purchase successful! Redirecting to your tickets...')
    navigate('/tickets', { state: { message: 'Ticket purchase successful!' } })
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
                onClick={handleCreateOrder}
                className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400"
              >
                Create order
              </button>
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
    </div>
  )
}

export default Checkout
