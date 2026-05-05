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

// ─── Keyframes ─────────────────────────────────────────────────────────────────
const CSS = `
@keyframes seatPop {
  0%   { transform: scale(1); }
  40%  { transform: scale(1.35); }
  100% { transform: scale(1); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes shimmerBar {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}
@keyframes pulse-ring {
  0%   { box-shadow: 0 0 0 0 rgba(14,165,233,0.4); }
  70%  { box-shadow: 0 0 0 6px rgba(14,165,233,0); }
  100% { box-shadow: 0 0 0 0 rgba(14,165,233,0); }
}
.seat-pop    { animation: seatPop 0.22s cubic-bezier(.34,1.56,.64,1); }
.fade-up     { animation: fadeSlideUp 0.4s cubic-bezier(.22,1,.36,1) both; }
.shimmer-btn {
  background: linear-gradient(90deg, #0ea5e9 0%, #6366f1 50%, #0ea5e9 100%);
  background-size: 200%;
  animation: shimmerBar 2.5s linear infinite;
}
.pulse-ring  { animation: pulse-ring 1.8s ease-out infinite; }
`

// ─── Icons ─────────────────────────────────────────────────────────────────────
function IconBack() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M10 3L5 8l5 5" />
    </svg>
  )
}
function IconStage() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 opacity-50">
      <rect x="2" y="7" width="20" height="13" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      <line x1="12" y1="12" x2="12" y2="16" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  )
}
function IconSeat() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M3 10V6a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v4" />
      <path d="M3 14h18" />
      <path d="M7 14v4M17 14v4" />
    </svg>
  )
}
function IconTicket() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <path d="M2 9a1 1 0 0 1 0-2V6h20v1a1 1 0 0 1 0 2v1a1 1 0 0 1 0 2v1H2v-1a1 1 0 0 1 0-2V9Z" />
      <line x1="9" y1="6" x2="9" y2="18" strokeDasharray="2 2" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" />
    </svg>
  )
}
function IconTrash() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}
function IconSpinner() {
  return (
    <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  )
}

// ─── Seat status styles ────────────────────────────────────────────────────────
const SEAT_BASE = 'relative min-w-0 rounded-md text-[9px] font-bold leading-none transition-all duration-150'
const SEAT_STYLE = {
  available: 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-500/30 cursor-pointer active:scale-90',
  selected: 'bg-sky-500 border border-sky-400 text-white shadow-lg shadow-sky-500/40 cursor-pointer scale-105',
  locked: 'bg-amber-400/20 border border-amber-400/30 text-amber-500/60 cursor-not-allowed',
  sold: 'bg-rose-500/15 border border-rose-500/20 text-rose-400/40 cursor-not-allowed line-through',
}

// ─── Loading skeleton ──────────────────────────────────────────────────────────
function Skeleton({ isDark }) {
  const p = isDark ? 'bg-slate-800' : 'bg-slate-200'
  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-[#f6f7fb]'}`}>
      <div className="mx-auto max-w-7xl px-6 py-8 md:px-8">
        <div className="mb-6 space-y-2">
          <div className={`h-3 w-24 animate-pulse rounded-full ${p}`} />
          <div className={`h-8 w-64 animate-pulse rounded-xl ${p}`} />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className={`h-[540px] animate-pulse rounded-2xl ${p}`} />
          <div className={`h-[380px] animate-pulse rounded-2xl ${p}`} />
        </div>
      </div>
    </div>
  )
}

// ─── Legend chip ───────────────────────────────────────────────────────────────
function LegendChip({ color, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-sm border" style={{ background: color.bg, borderColor: color.border }} />
      <span className="text-xs">{label}</span>
    </div>
  )
}

// ─── Selected seat row ─────────────────────────────────────────────────────────
function SeatRow({ seat, onRemove, isDark, removing }) {
  return (
    <div className={`fade-up flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-all ${isDark ? 'border-slate-700/60 bg-slate-800/60' : 'border-slate-200 bg-slate-50'
      }`}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/15">
          <IconSeat />
        </div>
        <div>
          <p className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{seat.label}</p>
          <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
            {seat.section_name ?? ''}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <span className={`text-xs font-semibold tabular-nums ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
          {(seat.price || 0).toLocaleString('vi-VN')} ₫
        </span>
        <button
          onClick={() => onRemove(seat)}
          disabled={removing}
          className={`flex h-6 w-6 items-center justify-center rounded-lg transition hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-40 ${isDark ? 'text-slate-600' : 'text-slate-300'}`}
        >
          <IconTrash />
        </button>
      </div>
    </div>
  )
}

// ─── Main ──────────────────────────────────────────────────────────────────────
function SeatMap() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()

  const [event, setEvent] = useState(null)
  const [seatMap, setSeatMap] = useState(null)
  const [selectedSectionId, setSelectedSectionId] = useState(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState(new Set())
  const [animatingIds, setAnimatingIds] = useState(new Set())
  const [loading, setLoading] = useState(true)
  const [locking, setLocking] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [error, setError] = useState('')
  const [cooldownSecs, setCooldownSecs] = useState(getCooldownRemaining)

  const patchSeat = useCallback((seatId, updates) => {
    setSeatMap(prev => prev ? {
      ...prev,
      sections: prev.sections.map(sec => ({
        ...sec, seats: sec.seats.map(s => s.id === seatId ? { ...s, ...updates } : s),
      })),
    } : prev)
  }, [])

  const fetchSeatMap = useCallback(async () => {
    try { setSeatMap(await eventsApi.seats(eventId)) } catch (e) { console.error(e) }
  }, [eventId])

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/', { replace: true }); return }
    setLoading(true)
    Promise.all([eventsApi.get(eventId), eventsApi.seats(eventId)])
      .then(([ev, map]) => {
        setEvent(ev); setSeatMap(map)
        setSelectedSectionId(map.sections[0]?.section_id ?? null)
        const myLocked = map.sections.flatMap(s => s.seats).filter(s => s.locked_by_me).map(s => s.id)
        if (myLocked.length) setSelectedSeatIds(new Set(myLocked))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventId, user, authLoading])

  useEffect(() => {
    if (!event) return
    const iv = setInterval(fetchSeatMap, 15000)
    return () => clearInterval(iv)
  }, [event, fetchSeatMap])

  useEffect(() => {
    if (cooldownSecs <= 0) return
    const iv = setInterval(() => {
      const r = getCooldownRemaining()
      setCooldownSecs(r)
      if (r <= 0) localStorage.removeItem(COOLDOWN_KEY)
    }, 1000)
    return () => clearInterval(iv)
  }, [cooldownSecs > 0])

  useEffect(() => {
    if (!seatMap) return
    const flat = seatMap.sections.flatMap(s => s.seats)
    setSelectedSeatIds(prev => {
      const next = new Set(prev); let changed = false
      for (const seat of flat) {
        if (next.has(seat.id) && (seat.status === 'sold' || (seat.status === 'locked' && !seat.locked_by_me))) {
          next.delete(seat.id); changed = true
        }
      }
      return changed ? next : prev
    })
  }, [seatMap])

  const currentSection = useMemo(
    () => seatMap?.sections.find(s => s.section_id === selectedSectionId),
    [seatMap, selectedSectionId]
  )
  const allSeats = useMemo(() => seatMap?.sections.flatMap(s => s.seats) ?? [], [seatMap])

  const selectedSeats = useMemo(
    () => allSeats.filter(s => selectedSeatIds.has(s.id)).map(s => {
      const sec = seatMap?.sections.find(sec => sec.seats.some(x => x.id === s.id))
      return { ...s, section_name: sec?.section_name }
    }),
    [allSeats, selectedSeatIds, seatMap]
  )

  const totalAmount = useMemo(() => selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0), [selectedSeats])

  const triggerAnim = (seatId) => {
    setAnimatingIds(prev => { const n = new Set(prev); n.add(seatId); return n })
    setTimeout(() => setAnimatingIds(prev => { const n = new Set(prev); n.delete(seatId); return n }), 220)
  }

  const handleSeatClick = async (seat) => {
    if (locking) return
    if (seat.status === 'sold' || (seat.status === 'locked' && !seat.locked_by_me)) return

    triggerAnim(seat.id)
    setError('')

    if (selectedSeatIds.has(seat.id)) {
      if (seat.locked_by_me) {
        setRemovingId(seat.id)
        try {
          await seatsApi.unlock(seat.id)
          patchSeat(seat.id, { status: 'available', locked_by_me: false })
        } catch (e) { setError(e.message); setRemovingId(null); return }
        setRemovingId(null)
      }
      setSelectedSeatIds(prev => { const n = new Set(prev); n.delete(seat.id); return n })
    } else {
      setSelectedSeatIds(prev => { const n = new Set(prev); n.add(seat.id); return n })
    }
  }

  const handleRemoveSeat = async (seat) => {
    triggerAnim(seat.id)
    await handleSeatClick(seat)
  }

  const handleProceedToPayment = async () => {
    if (!selectedSeatIds.size) return
    setLocking(true); setError('')
    try {
      const alreadyMine = allSeats.filter(s => selectedSeatIds.has(s.id) && s.locked_by_me).map(s => s.id)
      const needLocking = allSeats.filter(s => selectedSeatIds.has(s.id) && !s.locked_by_me).map(s => s.id)
      let finalIds = [...alreadyMine]
      if (needLocking.length) {
        const result = await seatsApi.lock(needLocking)
        if (result.failed?.length) {
          if (result.success?.length) await Promise.all(result.success.map(id => seatsApi.unlock(id)))
          const labels = allSeats.filter(s => result.failed.includes(s.id)).map(s => s.label).join(', ')
          setError(`Ghế ${labels} vừa bị người khác giữ. Vui lòng chọn ghế khác.`)
          setSelectedSeatIds(prev => { const n = new Set(prev); result.failed.forEach(id => n.delete(id)); return n })
          await fetchSeatMap(); return
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
    } finally { setLocking(false) }
  }

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-slate-500' : 'text-slate-400'
  const sub = isDark ? 'text-slate-400' : 'text-slate-500'

  if (loading) return <Skeleton isDark={isDark} />

  if (error && !event) {
    return (
      <div className={`${bg} flex min-h-[60vh] items-center justify-center px-6`}>
        <div className={`w-full max-w-md rounded-2xl border p-8 text-center ${card}`}>
          <p className="text-4xl mb-4">🎭</p>
          <h1 className="text-xl font-bold">Không tìm thấy sự kiện</h1>
          <p className={`mt-2 text-sm ${sub}`}>{error}</p>
          <Link to="/" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-400">
            <IconBack /> Về trang chủ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`${bg} min-h-screen`}>
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">

          {/* ── Header ── */}
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className={`mb-1 text-xs font-semibold uppercase tracking-widest text-sky-500`}>Chọn ghế ngồi</p>
              <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                {event?.title}
              </h1>
              {event?.venue_name && (
                <p className={`mt-0.5 flex items-center gap-1.5 text-sm ${sub}`}>
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                    <path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" />
                    <path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" />
                  </svg>
                  {event.venue_name}
                </p>
              )}
            </div>
            <Link
              to={`/events/${eventId}`}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-600 hover:bg-white'
                }`}
            >
              <IconBack /> Quay lại
            </Link>
          </div>

          {/* ── Error banner ── */}
          {error && (
            <div className="fade-up mb-5 flex items-start gap-3 rounded-xl border border-rose-400/20 bg-rose-400/8 px-4 py-3">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#f43f5e" strokeWidth="1.8">
                <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-start">

            {/* ══ SEAT MAP PANEL ══ */}
            <div className={`overflow-hidden rounded-2xl border lg:sticky lg:top-24 ${card}`}>

              {/* Section tabs */}
              <div className={`flex flex-wrap gap-2 border-b px-5 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                {seatMap?.sections.map(sec => {
                  const isActive = sec.section_id === selectedSectionId
                  return (
                    <button
                      key={sec.section_id}
                      onClick={() => setSelectedSectionId(sec.section_id)}
                      className={`relative rounded-xl border px-4 py-2 text-xs font-semibold transition hover:-translate-y-0.5 ${isActive
                        ? 'text-white shadow-md'
                        : isDark ? 'border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200' : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-800'
                        }`}
                      style={isActive ? { background: sec.color, borderColor: sec.color, boxShadow: `0 4px 14px ${sec.color}40` } : {}}
                    >
                      <span>{sec.section_name}</span>
                      <span className="ml-2 opacity-70">·</span>
                      <span className="ml-1 opacity-70">{Number(sec.price).toLocaleString('vi-VN')} ₫</span>
                      {isActive && (
                        <span className="ml-2 rounded-full bg-white/25 px-1.5 py-0.5 text-[9px] font-bold">
                          {sec.seats.filter(s => s.status === 'available').length} trống
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className={`flex flex-wrap items-center gap-4 border-b px-5 py-3 ${isDark ? 'border-slate-800' : 'border-slate-100'} ${muted}`}>
                <LegendChip color={{ bg: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.4)' }} label="Còn trống" />
                <LegendChip color={{ bg: 'rgba(14,165,233,0.9)', border: 'rgba(14,165,233,1)' }} label="Đã chọn" />
                <LegendChip color={{ bg: 'rgba(251,191,36,0.2)', border: 'rgba(251,191,36,0.3)' }} label="Đang giữ" />
                <LegendChip color={{ bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.2)' }} label="Đã bán" />
              </div>

              {/* Stage */}
              <div className="px-5 pt-5">
                <div className={`mb-5 flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold uppercase tracking-[0.2em] ${isDark ? 'bg-gradient-to-b from-slate-700/80 to-slate-800/80 text-slate-400' : 'bg-gradient-to-b from-slate-100 to-slate-50 text-slate-400'
                  }`}>
                  <IconStage /> Sân khấu
                </div>

                {/* Seats */}
                {currentSection && (
                  <div
                    className="grid gap-1.5 overflow-x-auto pb-5"
                    style={{ gridTemplateColumns: `repeat(${currentSection.cols}, minmax(0, 1fr))` }}
                  >
                    {currentSection.seats.map(seat => {
                      const isSelected = selectedSeatIds.has(seat.id)
                      const isAnimating = animatingIds.has(seat.id)
                      const status = isSelected ? 'selected' : seat.status
                      const disabled = locking || seat.status === 'sold' || (seat.status === 'locked' && !seat.locked_by_me)

                      return (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={disabled}
                          title={`${seat.label} · ${(seat.price || 0).toLocaleString('vi-VN')} ₫`}
                          className={`${SEAT_BASE} ${SEAT_STYLE[status] || SEAT_STYLE.available} ${isAnimating ? 'seat-pop' : ''} px-0.5 py-2`}
                        >
                          {seat.label?.split('-').pop() || seat.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ══ SIDEBAR ══ */}
            <aside className="space-y-4 lg:sticky lg:top-6">

              {/* Selected seats card */}
              <div className={`overflow-hidden rounded-2xl border ${card}`}>
                {/* header */}
                <div className={`border-b px-5 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      Ghế đã chọn
                    </h2>
                    {selectedSeats.length > 0 && (
                      <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-xs font-bold text-sky-400">
                        {selectedSeats.length}
                      </span>
                    )}
                  </div>
                  <p className={`mt-0.5 text-xs ${muted}`}>
                    Ghế sẽ được giữ khi bạn tiến hành thanh toán.
                  </p>
                </div>

                <div className="p-4">
                  {selectedSeats.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                      <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <IconSeat />
                      </div>
                      <p className={`text-xs font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chưa chọn ghế nào</p>
                      <p className={`mt-0.5 text-[10px] ${muted}`}>Nhấn vào ghế trống để chọn</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedSeats.map(seat => (
                        <SeatRow
                          key={seat.id} seat={seat} isDark={isDark}
                          onRemove={handleRemoveSeat}
                          removing={removingId === seat.id}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Total */}
                {selectedSeats.length > 0 && (
                  <div className={`border-t px-5 py-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-medium ${muted}`}>Tổng cộng</p>
                      <p className={`text-lg font-extrabold tabular-nums ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                        {totalAmount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Cooldown */}
              {cooldownSecs > 0 && (
                <div className={`fade-up overflow-hidden rounded-2xl border border-amber-400/25 ${isDark ? 'bg-amber-400/8' : 'bg-amber-50'}`}>
                  <div className="px-4 py-4 text-center">
                    <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-amber-400/15">
                      <IconClock />
                    </div>
                    <p className={`text-[11px] font-semibold uppercase tracking-widest text-amber-400`}>Thời gian chờ</p>
                    <p className="mt-1 text-3xl font-extrabold tabular-nums text-amber-400">
                      {formatCooldown(cooldownSecs)}
                    </p>
                    <p className={`mt-1.5 text-[11px] leading-relaxed ${muted}`}>
                      Bạn có thể giữ ghế và thanh toán sau khi hết thời gian chờ.
                    </p>
                  </div>
                </div>
              )}

              {/* CTA */}
              <button
                onClick={handleProceedToPayment}
                disabled={selectedSeats.length === 0 || locking || cooldownSecs > 0}
                className={`flex w-full items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${selectedSeats.length > 0 && !locking && !cooldownSecs
                  ? 'shimmer-btn hover:-translate-y-0.5 hover:shadow-sky-500/30'
                  : 'bg-slate-400'
                  }`}
              >
                {locking ? (
                  <><IconSpinner /> Đang xử lý…</>
                ) : cooldownSecs > 0 ? (
                  <><IconClock /> Chờ {formatCooldown(cooldownSecs)}</>
                ) : (
                  <><IconTicket /> Tiến hành thanh toán{selectedSeats.length > 0 && ` (${selectedSeats.length})`}</>
                )}
              </button>

              {selectedSeats.length > 0 && !cooldownSecs && !locking && (
                <p className={`text-center text-[11px] leading-relaxed ${muted}`}>
                  Ghế sẽ được giữ trong <strong>10 phút</strong> sau khi bạn nhấn tiến hành.
                </p>
              )}
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

export default SeatMap