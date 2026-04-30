import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { eventsApi, seatsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const COOLDOWN_KEY = 'ticketrush_payment_cooldown'

function getCooldownRemaining() {
  const until = localStorage.getItem(COOLDOWN_KEY)
  if (!until) return 0
  return Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 1000))
}

function formatCooldown(secs) {
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

const STATUS_STYLE = {
  available: 'bg-emerald-500 hover:bg-emerald-400 cursor-pointer text-white',
  selected:  'bg-sky-500 cursor-pointer text-white ring-2 ring-sky-300 ring-offset-1',
  locked:    'bg-amber-400 cursor-not-allowed text-slate-950 opacity-70',
  sold:      'bg-rose-500 cursor-not-allowed text-white opacity-50',
}

function SeatMap() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()

  const [event, setEvent] = useState(null)
  const [seatMap, setSeatMap] = useState(null)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState('')
  const [cooldownSecs, setCooldownSecs] = useState(getCooldownRemaining)

  // Patch a single seat in local state (used when unlocking a locked_by_me seat)
  const patchSeat = useCallback((seatId, updates) => {
    setSeatMap((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        sections: prev.sections.map((sec) => ({
          ...sec,
          seats: sec.seats.map((s) => s.id === seatId ? { ...s, ...updates } : s),
        })),
      }
    })
  }, [])

  const fetchSeatMap = useCallback(async () => {
    try {
      const map = await eventsApi.seats(eventId)
      setSeatMap(map)
    } catch (e) {
      console.error('seat map refresh error:', e)
    }
  }, [eventId])

  // Initial load — also restores seats locked in a previous session (e.g. logout mid-checkout)
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }
    setLoading(true)
    Promise.all([eventsApi.get(eventId), eventsApi.seats(eventId)])
      .then(([ev, map]) => {
        setEvent(ev)
        setSeatMap(map)
        setSelectedSectionId(map.sections[0]?.section_id ?? null)
        // If the user has seats left locked from a prior session, show them as selected
        // so they can either continue to payment or click to release the hold.
        const myLockedIds = map.sections
          .flatMap((s) => s.seats)
          .filter((s) => s.locked_by_me)
          .map((s) => s.id)
        if (myLockedIds.length) setSelectedSeatIds(new Set(myLockedIds))
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId, user, authLoading])

  // Poll seat map every 15s so other users' locks/sales are visible
  useEffect(() => {
    if (!event) return
    const iv = setInterval(fetchSeatMap, 15000)
    return () => clearInterval(iv)
  }, [event, fetchSeatMap])

  // Đếm ngược cooldown mỗi giây
  useEffect(() => {
    if (cooldownSecs <= 0) return
    const iv = setInterval(() => {
      const remaining = getCooldownRemaining()
      setCooldownSecs(remaining)
      if (remaining <= 0) localStorage.removeItem(COOLDOWN_KEY)
    }, 1000)
    return () => clearInterval(iv)
  }, [cooldownSecs > 0])

  // Drop locally-selected seats only when someone ELSE locks or buys them.
  // Do NOT drop seats that are still locked by this user (locked_by_me).
  useEffect(() => {
    if (!seatMap) return
    const flat = seatMap.sections.flatMap((s) => s.seats)
    setSelectedSeatIds((prev) => {
      const next = new Set(prev)
      let changed = false
      for (const seat of flat) {
        const takenByOther = seat.status === 'sold' || (seat.status === 'locked' && !seat.locked_by_me)
        if (next.has(seat.id) && takenByOther) {
          next.delete(seat.id)
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [seatMap])

  const currentSection = useMemo(
    () => seatMap?.sections.find((s) => s.section_id === selectedSectionId),
    [seatMap, selectedSectionId]
  )

  const allSeats = useMemo(
    () => seatMap?.sections.flatMap((s) => s.seats) ?? [],
    [seatMap]
  )

  const selectedSeats = useMemo(
    () => allSeats.filter((s) => selectedSeatIds.has(s.id)),
    [allSeats, selectedSeatIds]
  )

  const totalAmount = useMemo(
    () => selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0),
    [selectedSeats]
  )

  // Toggle seat selection.
  // - available seat → add to selection (no API call)
  // - selected available seat → remove from selection (no API call)
  // - locked_by_me seat → clicking deselects AND calls unlock to release the DB hold
  const handleSeatClick = async (seat) => {
    if (locking) return
    // Blocked: sold, or locked by someone else
    if (seat.status === 'sold' || (seat.status === 'locked' && !seat.locked_by_me)) return

    if (selectedSeatIds.has(seat.id)) {
      // Deselecting — if the seat was locked by this user in the DB, release the hold
      if (seat.locked_by_me) {
        try {
          await seatsApi.unlock(seat.id)
          patchSeat(seat.id, { status: 'available', locked_by_me: false })
        } catch (e) {
          setError(e.message)
          return
        }
      }
      setSelectedSeatIds((prev) => { const n = new Set(prev); n.delete(seat.id); return n })
    } else {
      setSelectedSeatIds((prev) => { const n = new Set(prev); n.add(seat.id); return n })
    }
    setError('')
  }

  // Lock all selected seats (skipping any already locked by this user) then navigate to checkout
  const handleProceedToPayment = async () => {
    if (selectedSeatIds.size === 0) return
    setLocking(true)
    setError('')
    try {
      // Split: seats already mine in DB (no re-lock needed) vs. seats to lock now
      const alreadyMine = allSeats.filter((s) => selectedSeatIds.has(s.id) && s.locked_by_me).map((s) => s.id)
      const needLocking  = allSeats.filter((s) => selectedSeatIds.has(s.id) && !s.locked_by_me).map((s) => s.id)

      let finalIds = [...alreadyMine]

      if (needLocking.length) {
        const result = await seatsApi.lock(needLocking)
        if (result.failed?.length) {
          // Roll back any seats that were locked in this call
          if (result.success?.length) {
            await Promise.all(result.success.map((id) => seatsApi.unlock(id)))
          }
          const takenLabels = allSeats
            .filter((s) => result.failed.includes(s.id))
            .map((s) => s.label)
            .join(', ')
          setError(`Ghế ${takenLabels} vừa bị người khác giữ. Vui lòng chọn ghế khác.`)
          setSelectedSeatIds((prev) => {
            const next = new Set(prev)
            result.failed.forEach((id) => next.delete(id))
            return next
          })
          await fetchSeatMap()
          return
        }
        finalIds = [...finalIds, ...result.success]
      }

      navigate('/checkout', { state: { seatIds: finalIds, eventTitle: event?.title } })
    } catch (e) {
      if (e.code === 'PAYMENT_COOLDOWN' && e.cooldown_until) {
        localStorage.setItem(COOLDOWN_KEY, e.cooldown_until)
        setCooldownSecs(getCooldownRemaining())
      }
      setError(e.message)
    } finally {
      setLocking(false)
    }
  }

  const bg   = isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
  const card = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
  const sub  = isDark ? 'text-slate-400' : 'text-slate-600'

  if (loading) {
    return <div className={`py-16 text-center ${sub}`}>Đang tải sơ đồ ghế...</div>
  }

  if (error && !event) {
    return (
      <div className={`mx-auto max-w-7xl px-4 py-16 md:px-8 ${bg}`}>
        <div className={`rounded-3xl border p-8 ${card}`}>
          <h1 className="text-2xl font-semibold">Không tìm thấy sự kiện</h1>
          <p className={`mt-2 ${sub}`}>{error}</p>
          <Link to="/" className="mt-4 inline-flex rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white">Về trang chủ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className={bg}>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-500">Chọn ghế</p>
            <h1 className="text-3xl font-semibold">{event?.title}</h1>
          </div>
          <Link
            to={`/events/${eventId}`}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/10' : 'border-slate-200 text-slate-700 hover:bg-slate-100'}`}
          >
            Quay lại sự kiện
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-400">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Seat grid */}
          <div className={`rounded-3xl border p-5 ${card}`}>
            {/* Section tabs */}
            <div className="mb-4 flex flex-wrap gap-2">
              {seatMap?.sections.map((sec) => (
                <button
                  key={sec.section_id}
                  onClick={() => setSelectedSectionId(sec.section_id)}
                  style={selectedSectionId === sec.section_id ? { background: sec.color } : {}}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    selectedSectionId === sec.section_id
                      ? 'text-white shadow-md'
                      : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {sec.section_name} · {sec.price.toLocaleString()} VND
                </button>
              ))}
            </div>

            {/* Legend */}
            <div className="mb-4 flex flex-wrap gap-3 text-xs">
              <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-emerald-400">Còn trống</span>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-sky-400">Đã chọn</span>
              <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-amber-400">Đang giữ</span>
              <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-rose-400">Đã bán</span>
            </div>

            {/* Stage indicator */}
            <div className={`mb-5 rounded-xl px-4 py-2 text-center text-xs uppercase tracking-widest ${isDark ? 'bg-white/5 text-slate-500' : 'bg-slate-100 text-slate-500'}`}>
              ── SÂN KHẤU ──
            </div>

            {/* Seat grid */}
            {currentSection && (
              <div
                className="grid gap-1 overflow-x-auto pb-2"
                style={{ gridTemplateColumns: `repeat(${currentSection.cols}, minmax(0, 1fr))` }}
              >
                {currentSection.seats.map((seat) => {
                  const isSelected = selectedSeatIds.has(seat.id)
                  const displayStatus = isSelected ? 'selected' : seat.status
                  // Allow clicking: available seats + seats locked by this user (to deselect/release)
                  const isDisabled = locking || seat.status === 'sold' || (seat.status === 'locked' && !seat.locked_by_me)
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={isDisabled}
                      title={`${seat.label} · ${(seat.price || 0).toLocaleString()} VND`}
                      className={`min-w-0 rounded px-1 py-1.5 text-[8px] font-medium leading-none transition disabled:cursor-not-allowed ${STATUS_STYLE[displayStatus] || STATUS_STYLE.available}`}
                    >
                      {seat.label?.split('-').pop() || seat.label}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className={`space-y-4 rounded-3xl border p-5 ${card}`}>
            <div>
              <h2 className="text-xl font-semibold">Ghế đã chọn</h2>
              <p className={`text-sm ${sub}`}>Ghế sẽ được giữ khi bạn nhấn tiến hành thanh toán.</p>
            </div>

            <div className="space-y-2">
              {selectedSeats.length === 0 ? (
                <div className={`rounded-2xl border border-dashed p-4 text-center text-sm ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                  Chưa chọn ghế nào.
                </div>
              ) : (
                selectedSeats.map((seat) => (
                  <div
                    key={seat.id}
                    className={`flex items-center justify-between rounded-xl border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}
                  >
                    <span className="font-medium">{seat.label}</span>
                    <span className={sub}>{(seat.price || 0).toLocaleString()} VND</span>
                  </div>
                ))
              )}
            </div>

            {selectedSeats.length > 0 && (
              <div className={`rounded-2xl p-3 ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
                <p className={`text-xs ${sub}`}>Tổng cộng</p>
                <p className={`text-2xl font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                  {totalAmount.toLocaleString()} VND
                </p>
              </div>
            )}

            {cooldownSecs > 0 && (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-center">
                <p className="text-xs font-medium text-amber-400">Thời gian chờ do hủy thanh toán</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-amber-300">
                  {formatCooldown(cooldownSecs)}
                </p>
                <p className={`mt-1 text-xs ${sub}`}>Bạn có thể giữ ghế sau khi hết thời gian chờ.</p>
              </div>
            )}

            <button
              onClick={handleProceedToPayment}
              disabled={selectedSeats.length === 0 || locking || cooldownSecs > 0}
              className="w-full rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {locking ? 'Đang xử lý...' : cooldownSecs > 0 ? `Chờ ${formatCooldown(cooldownSecs)}` : `Tiến hành thanh toán (${selectedSeats.length})`}
            </button>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default SeatMap
