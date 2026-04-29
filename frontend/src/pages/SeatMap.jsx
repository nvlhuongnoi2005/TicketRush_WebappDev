import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { eventsApi, seatsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { useQueue } from '../context/QueueContext'

const MAX_SEATS = 5

// Backend returns naive UTC datetimes without 'Z'. Append it so JS parses as UTC, not local time.
function parseUTCMs(s) {
  if (!s) return null
  const str = s.endsWith('Z') || s.includes('+') ? s : s + 'Z'
  return new Date(str).getTime()
}

const seatStyles = {
  available: 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer text-white',
  locked: 'bg-amber-400 text-slate-950 cursor-pointer',
  sold: 'bg-rose-500 text-white cursor-not-allowed',
  locked_by_me: 'bg-emerald-700 cursor-pointer text-white ring-2 ring-cyan-300 ring-offset-1 ring-offset-slate-950',
  pending: 'bg-cyan-500 cursor-wait text-white opacity-70',
}

function formatDuration(ms) {
  const total = Math.max(Math.floor(ms / 1000), 0)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function SeatMap() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { hasAccessToken, getTokenExpiry, clearAccessToken } = useQueue()

  const [event, setEvent] = useState(null)
  const [sections, setSections] = useState([])
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [lockedSeatIds, setLockedSeatIds] = useState(new Set())
  const [pendingSeatIds, setPendingSeatIds] = useState(new Set())
  const [lockExpiresAt, setLockExpiresAt] = useState(null)
  const [queueExpiresAt, setQueueExpiresAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const toastTimerRef = useRef(null)

  const showToast = useCallback((msg, type = 'error') => {
    clearTimeout(toastTimerRef.current)
    setToast({ msg, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }, [])

  useEffect(() => {
    if (!user) navigate('/login', { replace: true })
  }, [user, navigate])

  useEffect(() => {
    Promise.all([eventsApi.get(eventId), eventsApi.seats(eventId)])
      .then(([eventData, seatMap]) => {
        setEvent(eventData)
        const secs = seatMap.sections || []
        setSections(secs)
        setSelectedSectionId(secs[0]?.section_id ?? null)

        const myIds = new Set()
        let expiresAt = null
        const nowMs = Date.now()
        for (const sec of secs) {
          for (const seat of sec.seats) {
            if (seat.locked_by_me) {
              const expMs = parseUTCMs(seat.lock_expires_at) ?? 0
              if (expMs > nowMs) {
                myIds.add(seat.id)
                if (!expiresAt) expiresAt = expMs
              }
            }
          }
        }
        setLockedSeatIds(myIds)
        if (expiresAt) setLockExpiresAt(expiresAt)

        if (eventData.queue_enabled) {
          if (!hasAccessToken(eventId)) {
            navigate(`/waiting-room/${eventId}`, { replace: true })
            return
          }
          const exp = getTokenExpiry(eventId)
          if (exp) setQueueExpiresAt(exp.getTime())
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [eventId])

  // WebSocket real-time seat updates
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    let active = true
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/events/${eventId}/seats`)

    ws.onmessage = (e) => {
      if (!active) return
      try {
        const msg = JSON.parse(e.data)
        if (msg.event === 'seat_update' && Array.isArray(msg.data)) {
          setSections((prev) =>
            prev.map((sec) => ({
              ...sec,
              seats: sec.seats.map((seat) => {
                const upd = msg.data.find((u) => u.seat_id === seat.id)
                return upd ? { ...seat, status: upd.status } : seat
              }),
            }))
          )
        }
      } catch {}
    }
    ws.onerror = () => {}

    return () => {
      active = false
      ws.close()
    }
  }, [eventId])

  // Clock ticker every second
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-release local hold state on seat lock expiry
  useEffect(() => {
    if (!lockExpiresAt) return
    const delay = Math.max(lockExpiresAt - Date.now(), 0)
    const t = setTimeout(() => { setLockedSeatIds(new Set()); setLockExpiresAt(null) }, delay)
    return () => clearTimeout(t)
  }, [lockExpiresAt])

  // Queue session expiry → redirect back to waiting room
  useEffect(() => {
    if (!queueExpiresAt) return
    const delay = queueExpiresAt - Date.now()
    if (delay <= 0) {
      clearAccessToken(eventId)
      navigate(`/waiting-room/${eventId}`, { replace: true })
      return
    }
    const t = setTimeout(() => {
      clearAccessToken(eventId)
      navigate(`/waiting-room/${eventId}`, { replace: true })
    }, delay)
    return () => clearTimeout(t)
  }, [queueExpiresAt])

  const selectedSection = useMemo(
    () => sections.find((s) => s.section_id === selectedSectionId),
    [sections, selectedSectionId]
  )

  const displaySeats = useMemo(() => {
    if (!selectedSection) return []
    return selectedSection.seats.map((seat) => {
      if (pendingSeatIds.has(seat.id)) return { ...seat, status: 'pending' }
      if (lockedSeatIds.has(seat.id)) return { ...seat, status: 'locked_by_me' }
      return seat
    })
  }, [selectedSection, lockedSeatIds, pendingSeatIds])

  const allLockedSeats = useMemo(() => {
    const result = []
    for (const sec of sections) {
      for (const seat of sec.seats) {
        if (lockedSeatIds.has(seat.id)) result.push({ ...seat, sectionName: sec.section_name })
      }
    }
    return result
  }, [sections, lockedSeatIds])

  const totalAmount = useMemo(
    () => allLockedSeats.reduce((sum, s) => sum + (s.price || 0), 0),
    [allLockedSeats]
  )

  const toggleSeat = useCallback(async (seat) => {
    console.log('[toggleSeat] called', { id: seat.id, status: seat.status, locked: lockedSeatIds.has(seat.id), pending: pendingSeatIds.has(seat.id) })

    // Deselect own locked seat
    if (lockedSeatIds.has(seat.id)) {
      setLockedSeatIds((prev) => { const n = new Set(prev); n.delete(seat.id); return n })
      try { await seatsApi.unlock(seat.id) }
      catch { setLockedSeatIds((prev) => new Set([...prev, seat.id])) }
      return
    }

    if (seat.status === 'locked') {
      showToast('This seat has already been selected by another user.')
      return
    }
    if (seat.status === 'sold') {
      showToast('This seat has already been sold.')
      return
    }
    if (seat.status !== 'available' || pendingSeatIds.has(seat.id)) {
      console.log('[toggleSeat] early return – status not available or pending', seat.status)
      return
    }

    if (lockedSeatIds.size >= MAX_SEATS) {
      showToast(`You can only select up to ${MAX_SEATS} seats.`)
      return
    }

    setPendingSeatIds((prev) => new Set([...prev, seat.id]))
    try {
      const data = await seatsApi.lock([seat.id])
      console.log('[toggleSeat] lock response', data)
      if (data?.success?.includes(seat.id)) {
        console.log('[toggleSeat] adding to lockedSeatIds', seat.id)
        setLockedSeatIds((prev) => new Set([...prev, seat.id]))
        const expMs = parseUTCMs(data.lock_expires_at)
        if (expMs) setLockExpiresAt(expMs)
        else if (!lockExpiresAt) setLockExpiresAt(Date.now() + 10 * 60 * 1000)
      } else {
        console.log('[toggleSeat] success array did not include seat.id', data?.success, seat.id)
        showToast('This seat has already been selected by another user.')
      }
    } catch (err) {
      console.error('[toggleSeat] error', err)
      if (err.status === 401) { logout(); navigate('/login', { replace: true }); return }
      showToast(err.message || 'Unable to hold seat. Please try again.')
    } finally {
      setPendingSeatIds((prev) => { const n = new Set(prev); n.delete(seat.id); return n })
    }
  }, [lockedSeatIds, pendingSeatIds, lockExpiresAt, showToast, logout, navigate, eventId])

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-400 md:px-8">Loading seat map...</div>
  }
  if (!event) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-white md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="text-3xl font-semibold">Seat map not found</h1>
          <Link to="/" className="mt-6 inline-flex rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Back to home</Link>
        </div>
      </div>
    )
  }

  const countdown = lockExpiresAt ? formatDuration(lockExpiresAt - now) : null
  const queueCountdown = queueExpiresAt ? formatDuration(queueExpiresAt - now) : null
  const lockWarn = lockExpiresAt && lockExpiresAt - now < 120_000
  const queueWarn = queueExpiresAt && queueExpiresAt - now < 120_000

  return (
    <div className="bg-slate-950 text-white">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-2xl px-6 py-3 text-sm font-semibold shadow-2xl ${
          toast.type === 'error' ? 'bg-rose-500 text-white' : 'bg-cyan-500 text-white'
        }`}>
          {toast.msg}
        </div>
      )}

      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Seat selection</p>
            <h1 className="text-3xl font-semibold">{event.title}</h1>
          </div>
          <Link to={`/events/${event.id}`} className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium">
            Back to event
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Left: Seat grid */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            {/* Section tabs with live available count */}
            <div className="mb-4 flex flex-wrap gap-2">
              {sections.map((sec) => {
                const available = sec.seats.filter((s) => s.status === 'available').length
                const total = sec.seats.length
                const active = selectedSectionId === sec.section_id
                return (
                  <button
                    key={sec.section_id}
                    onClick={() => setSelectedSectionId(sec.section_id)}
                    className={`flex flex-col items-start rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                      active ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    <span className="font-semibold">{sec.section_name}</span>
                    <span className={`mt-0.5 flex items-center gap-2 text-xs ${active ? 'text-slate-700' : 'text-slate-400'}`}>
                      <span>{sec.price.toLocaleString()}đ</span>
                      <span>·</span>
                      <span className={available === 0 ? 'text-rose-400' : ''}>
                        {available}/{total} available
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="mb-5 flex flex-wrap gap-3 text-xs text-slate-300">
              {[
                ['bg-emerald-500', 'Available'],
                ['bg-amber-400', 'Held by others'],
                ['bg-rose-500', 'Sold'],
                ['bg-emerald-700 ring-1 ring-cyan-300', 'Holding'],
              ].map(([cls, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`h-3 w-3 rounded-sm ${cls}`} />{label}
                </span>
              ))}
            </div>

            {/* Screen indicator */}
            <div className="mb-4 rounded-2xl bg-slate-900 px-4 py-3 text-center text-sm text-slate-300">
              ── Screen ──
            </div>

            {/* Per-section timer bar */}
            {selectedSection && countdown && (
              <div className={`mb-4 flex items-center justify-between rounded-xl px-4 py-2.5 text-sm ${
                lockWarn ? 'bg-rose-400/15 text-rose-300' : 'bg-white/5 text-slate-300'
              }`}>
                <span className="font-medium">{selectedSection.section_name} — seats held</span>
                <span className={`font-mono text-base font-semibold ${lockWarn ? 'text-rose-300' : 'text-cyan-300'}`}>
                  {countdown}
                </span>
              </div>
            )}

            {/* Seat grid */}
            {selectedSection ? (
              <div
                className="grid gap-1.5 overflow-x-auto pb-2"
                style={{ gridTemplateColumns: `repeat(${selectedSection.cols}, minmax(0, 1fr))` }}
              >
                {displaySeats.map((seat) => (
                  <button
                    key={seat.id}
                    onClick={() => toggleSeat(seat)}
                    disabled={seat.status === 'sold' || seat.status === 'pending'}
                    className={`min-w-0 rounded-md px-1 py-2 text-[9px] leading-none font-semibold transition-all ${seatStyles[seat.status] ?? seatStyles.available}`}
                    title={`${seat.label} — ${(seat.price || 0).toLocaleString()} VND`}
                  >
                    {seat.label?.split('-').slice(1).join('-') || seat.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-500">No sections available.</p>
            )}
          </div>

          {/* Right: Sidebar */}
          <aside className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <div>
              <h2 className="text-xl font-semibold">Holding seats</h2>
              <p className="text-sm text-slate-400">{allLockedSeats.length}/{MAX_SEATS} · Locks expire after 10 min.</p>
            </div>

            {/* Queue session timer */}
            {queueCountdown && (
              <div className={`rounded-xl border p-4 ${queueWarn ? 'border-rose-400/30 bg-rose-400/10' : 'border-amber-400/20 bg-amber-400/5'}`}>
                <p className={`text-xs font-medium ${queueWarn ? 'text-rose-400' : 'text-amber-400'}`}>Queue session expires in</p>
                <p className={`mt-0.5 font-mono text-2xl font-semibold ${queueWarn ? 'text-rose-300' : 'text-amber-200'}`}>{queueCountdown}</p>
                {queueWarn && <p className="mt-1 text-xs text-rose-400">Complete checkout before time runs out!</p>}
              </div>
            )}

            {/* Seat lock timer */}
            {countdown && (
              <div className={`rounded-xl border p-4 ${lockWarn ? 'border-rose-400/30 bg-rose-400/10' : 'border-white/10 bg-slate-950'}`}>
                <p className="text-xs text-slate-400">Hold expires in</p>
                <p className={`mt-0.5 font-mono text-2xl font-semibold ${lockWarn ? 'text-rose-300' : 'text-white'}`}>{countdown}</p>
              </div>
            )}

            {/* Seat list */}
            <div className="space-y-2">
              {allLockedSeats.length ? allLockedSeats.map((seat) => (
                <div key={seat.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950 px-4 py-3">
                  <div>
                    <p className="font-medium">{seat.label}</p>
                    <p className="text-xs text-slate-400">{seat.sectionName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-cyan-300">{(seat.price || 0).toLocaleString()} VND</p>
                    <button onClick={() => toggleSeat(seat)} className="text-xs text-rose-400 hover:text-rose-300">Remove</button>
                  </div>
                </div>
              )) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950 p-4 text-sm text-slate-400">
                  No seats selected yet. Click any green seat to hold it.
                </div>
              )}
            </div>

            {/* Total */}
            <div className="rounded-xl bg-slate-950 p-4">
              <p className="text-xs text-slate-400">Total</p>
              <p className="text-2xl font-semibold text-cyan-300">{totalAmount.toLocaleString()} VND</p>
            </div>

            <Link
              to="/checkout"
              state={{ eventId: event.id, eventTitle: event.title, seats: allLockedSeats, totalAmount }}
              className={`block rounded-full px-5 py-3 text-center font-semibold transition ${
                allLockedSeats.length ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'cursor-not-allowed bg-slate-700 text-slate-400'
              }`}
              onClick={(e) => !allLockedSeats.length && e.preventDefault()}
            >
              Proceed to checkout ({allLockedSeats.length}/{MAX_SEATS})
            </Link>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default SeatMap
