import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { eventsApi, seatsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

const STATUS_STYLE = {
  available:    'bg-emerald-500 hover:bg-emerald-400 cursor-pointer text-white',
  locked:       'bg-amber-400 cursor-not-allowed text-slate-950 opacity-70',
  sold:         'bg-rose-500 cursor-not-allowed text-white opacity-50',
  locked_by_me: 'bg-sky-500 cursor-pointer text-white ring-2 ring-sky-300 ring-offset-1',
}

const toUtcMs = (dateStr) => {
  if (!dateStr) return null
  const s = String(dateStr)
  return new Date(s.match(/[Z+]/) ? s : s + 'Z').getTime()
}

function formatDuration(ms) {
  const secs = Math.max(Math.floor(ms / 1000), 0)
  return `${String(Math.floor(secs / 60)).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`
}

function SeatMap() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()

  const [event, setEvent] = useState(null)
  const [seatMap, setSeatMap] = useState(null)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [error, setError] = useState('')
  const [now, setNow] = useState(Date.now())

  // 1-second clock for countdown
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Patch a single seat in the local seatMap state
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

  // Initial load
  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }
    setLoading(true)
    Promise.all([eventsApi.get(eventId), eventsApi.seats(eventId)])
      .then(([ev, map]) => {
        setEvent(ev)
        setSeatMap(map)
        setSelectedSectionId(map.sections[0]?.section_id ?? null)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId, user, authLoading])

  // Poll seat map every 15s so other users' locks are visible
  useEffect(() => {
    if (!event) return
    const iv = setInterval(fetchSeatMap, 15000)
    return () => clearInterval(iv)
  }, [event, fetchSeatMap])

  // Derived state
  const currentSection = useMemo(
    () => seatMap?.sections.find((s) => s.section_id === selectedSectionId),
    [seatMap, selectedSectionId]
  )

  const allSeats = useMemo(
    () => seatMap?.sections.flatMap((s) => s.seats) ?? [],
    [seatMap]
  )

  const lockedByMeSeats = useMemo(
    () => allSeats.filter((s) => s.locked_by_me),
    [allSeats]
  )

  const lockExpiresAt = useMemo(() => {
    const seat = lockedByMeSeats.find((s) => s.lock_expires_at)
    return seat ? toUtcMs(seat.lock_expires_at) : null
  }, [lockedByMeSeats])

  const totalAmount = useMemo(
    () => lockedByMeSeats.reduce((sum, s) => sum + (s.price || 0), 0),
    [lockedByMeSeats]
  )

  const handleSeatClick = async (seat) => {
    if (locking) return
    if (seat.locked_by_me) {
      // Unlock
      try {
        await seatsApi.unlock(seat.id)
        patchSeat(seat.id, { status: 'available', locked_by_me: false, lock_expires_at: null })
      } catch (e) {
        setError(e.message)
      }
      return
    }
    if (seat.status !== 'available') return
    setLocking(true)
    setError('')
    try {
      const result = await seatsApi.lock([seat.id])
      if (result.success?.includes(seat.id)) {
        patchSeat(seat.id, {
          status: 'locked',
          locked_by_me: true,
          lock_expires_at: result.lock_expires_at ?? null,
        })
      } else {
        setError(`Ghế ${seat.label} vừa bị người khác giữ.`)
        patchSeat(seat.id, { status: 'locked', locked_by_me: false })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLocking(false)
    }
  }

  const bg    = isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
  const card  = isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
  const sub   = isDark ? 'text-slate-400' : 'text-slate-600'
  const inputCls = isDark
    ? 'border-white/10 bg-slate-800 text-white'
    : 'border-slate-200 bg-white text-slate-900'

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

  const lockRemainingMs = lockExpiresAt ? lockExpiresAt - now : 0

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
              <span className="rounded-full bg-amber-400/20 px-2.5 py-1 text-amber-400">Đang giữ</span>
              <span className="rounded-full bg-rose-500/20 px-2.5 py-1 text-rose-400">Đã bán</span>
              <span className="rounded-full bg-sky-500/20 px-2.5 py-1 text-sky-400">Ghế của bạn</span>
            </div>

            {/* Screen indicator */}
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
                  const displayStatus = seat.locked_by_me ? 'locked_by_me' : seat.status
                  return (
                    <button
                      key={seat.id}
                      onClick={() => handleSeatClick(seat)}
                      disabled={locking || displayStatus === 'sold' || displayStatus === 'locked'}
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
              <p className={`text-sm ${sub}`}>Nhấn ghế để giữ chỗ (tối đa 5 ghế, 10 phút).</p>
            </div>

            {lockExpiresAt && lockRemainingMs > 0 && (
              <div className={`rounded-2xl border p-3 text-sm ${isDark ? 'border-amber-400/20 bg-amber-400/10' : 'border-amber-200 bg-amber-50'}`}>
                <p className={`text-xs ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Thời gian giữ chỗ</p>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {formatDuration(lockRemainingMs)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {lockedByMeSeats.length === 0 ? (
                <div className={`rounded-2xl border border-dashed p-4 text-center text-sm ${isDark ? 'border-white/10 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                  Chưa chọn ghế nào.
                </div>
              ) : (
                lockedByMeSeats.map((seat) => (
                  <div key={seat.id} className={`flex items-center justify-between rounded-xl border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                    <span className="font-medium">{seat.label}</span>
                    <span className={sub}>{(seat.price || 0).toLocaleString()} VND</span>
                  </div>
                ))
              )}
            </div>

            {lockedByMeSeats.length > 0 && (
              <div className={`rounded-2xl p-3 ${isDark ? 'bg-sky-500/10' : 'bg-sky-50'}`}>
                <p className={`text-xs ${sub}`}>Tổng cộng</p>
                <p className={`text-2xl font-semibold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                  {totalAmount.toLocaleString()} VND
                </p>
              </div>
            )}

            <button
              onClick={() => navigate('/checkout', { state: { seatIds: lockedByMeSeats.map((s) => s.id), eventTitle: event?.title } })}
              disabled={lockedByMeSeats.length === 0}
              className="w-full rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Tiến hành thanh toán ({lockedByMeSeats.length})
            </button>
          </aside>
        </div>
      </section>
    </div>
  )
}

export default SeatMap
