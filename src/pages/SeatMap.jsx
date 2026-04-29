import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { createSeatGrid, getEventById } from '../data/mockData'
import { useAuth } from '../context/AuthContext'

const seatStyles = {
  available: 'bg-emerald-500 hover:bg-emerald-400 text-white',
  locked: 'bg-amber-400 text-slate-950',
  sold: 'bg-rose-500 text-white',
  locked_by_me: 'bg-emerald-700 text-white',
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(Math.floor(milliseconds / 1000), 0)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function SeatMap() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const event = getEventById(eventId)
  const [selectedSectionId, setSelectedSectionId] = useState(event?.sections?.[0]?.id)
  const [lockedSeatIds, setLockedSeatIds] = useState([])
  const [lockExpiresAt, setLockExpiresAt] = useState(null)
  const [now, setNow] = useState(Date.now())

  // Check authentication
  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
    }
  }, [user, navigate])

  const selectedSection = event?.sections?.find((section) => section.id === selectedSectionId)

  const seats = useMemo(() => {
    if (!selectedSection) return []
    return createSeatGrid(selectedSection).map((seat) => ({
      ...seat,
      status: lockedSeatIds.includes(seat.id) ? 'locked_by_me' : seat.status,
    }))
  }, [selectedSection, lockedSeatIds])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!lockExpiresAt) return undefined

    const timeout = setTimeout(() => {
      setLockedSeatIds([])
      setLockExpiresAt(null)
    }, Math.max(lockExpiresAt - Date.now(), 0))

    return () => clearTimeout(timeout)
  }, [lockExpiresAt])

  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-slate-900 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Seat map not found</h1>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-sky-500 px-4 py-2 font-semibold text-white">
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  const toggleSeat = (seat) => {
    if (seat.status !== 'available' && seat.status !== 'locked_by_me') return

    if (seat.status === 'available') {
      setLockedSeatIds((prev) => (prev.includes(seat.id) ? prev : [...prev, seat.id]))
      setLockExpiresAt(Date.now() + 10 * 60 * 1000)
      return
    }

    setLockedSeatIds((prev) => prev.filter((item) => item !== seat.id))
    if (lockedSeatIds.length <= 1) {
      setLockExpiresAt(null)
    }
  }

  const selectedSeats = seats.filter((seat) => lockedSeatIds.includes(seat.id))
  const totalAmount = selectedSeats.reduce((sum, seat) => sum + seat.price, 0)
  const countdown = lockExpiresAt ? formatDuration(lockExpiresAt - now) : '10:00'

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Seat selection</p>
            <h1 className="text-3xl font-semibold">{event.title}</h1>
          </div>
          <Link to={`/events/${event.id}`} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
            Back to event
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <div className="mb-4 flex flex-wrap gap-2">
              {event.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    setSelectedSectionId(section.id)
                    setLockedSeatIds([])
                    setLockExpiresAt(null)
                  }}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    selectedSectionId === section.id ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {section.name}
                </button>
              ))}
            </div>

            <div className="mb-5 flex flex-wrap gap-3 text-xs text-slate-600">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">Available</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">Locked</span>
              <span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-700">Sold</span>
              <span className="rounded-full bg-emerald-200 px-2.5 py-1 text-emerald-800">Locked by me</span>
            </div>

            <div className="mb-6 rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm text-slate-600">
              Screen
            </div>

            <div
              className="grid gap-1.5 overflow-x-auto pb-2"
              style={{ gridTemplateColumns: `repeat(${selectedSection?.cols || 1}, minmax(0, 1fr))` }}
            >
              {seats.map((seat) => {
                const isSelected = lockedSeatIds.includes(seat.id)
                return (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    className={`min-w-0 rounded-md px-1.5 py-1.5 text-[8px] leading-none font-medium transition ${
                      isSelected ? 'ring-2 ring-sky-300 ring-offset-2 ring-offset-white' : ''
                    } ${seatStyles[seat.status]}`}
                    title={`${seat.label} - ${seat.price.toLocaleString()} VND`}
                  >
                    {seat.label}
                  </button>
                )
              })}
            </div>
          </div>

          <aside className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <div>
              <h2 className="text-xl font-semibold">Selected seats</h2>
              <p className="text-sm text-slate-600">Click a seat to lock it immediately for 10 minutes.</p>
            </div>
            <div className="space-y-3">
              {selectedSeats.length ? (
                selectedSeats.map((seat) => (
                  <div key={seat.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{seat.label}</p>
                      <p className="text-sm text-slate-600">{seat.price.toLocaleString()} VND</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No seats selected yet.
                </div>
              )}
            </div>
            <div className="rounded-2xl bg-sky-50 p-4">
              <p className="text-sm text-slate-500">Total</p>
              <p className="text-2xl font-semibold text-sky-700">{totalAmount.toLocaleString()} VND</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <p className="text-slate-500">Lock timer</p>
              <p className="mt-1 text-lg font-semibold text-slate-900">{countdown}</p>
            </div>
            <div className="grid gap-3">
              <Link
                to="/checkout"
                state={{ eventId: event.id, seats: selectedSeats, totalAmount }}
                className="rounded-full bg-sky-500 px-5 py-3 text-center font-semibold text-white transition hover:bg-sky-400"
              >
                Proceed to checkout
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default SeatMap
