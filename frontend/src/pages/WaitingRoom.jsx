import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { eventsApi, queueApi } from '../lib/api'
import { useTheme } from '../context/ThemeContext.jsx'

function getOrCreateSessionId(eventId) {
  const key = `queue_session_${eventId}`
  const stored = sessionStorage.getItem(key)
  if (stored) return stored
  const id = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  sessionStorage.setItem(key, id)
  return id
}

// ─── Animated ring spinner ─────────────────────────────────────────────────────
function RingSpinner({ size = 56, color = '#38bdf8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 56 56" fill="none" className="animate-spin" style={{ animationDuration: '1.2s' }}>
      <circle cx="28" cy="28" r="22" stroke={color} strokeOpacity="0.15" strokeWidth="4" />
      <path
        d="M28 6 A22 22 0 0 1 50 28"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}

// ─── Pulse dots ────────────────────────────────────────────────────────────────
function PulseDots({ isDark }) {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${isDark ? 'bg-slate-500' : 'bg-slate-300'} animate-pulse`}
          style={{ animationDelay: `${i * 0.2}s`, animationDuration: '1s' }}
        />
      ))}
    </div>
  )
}

// ─── Queue position ring ───────────────────────────────────────────────────────
function QueueRing({ position, total, pct, isDark }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = circ * (pct / 100)

  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke={isDark ? '#1e293b' : '#f1f5f9'}
          strokeWidth="10"
        />
        <circle
          cx="80" cy="80" r={r}
          fill="none"
          stroke="url(#qGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-700 ease-out"
        />
        <defs>
          <linearGradient id="qGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className={`text-3xl font-extrabold tabular-nums leading-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
          {position ?? '-'}
        </p>
        <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          / {total ?? '…'}
        </p>
        <p className={`mt-1 text-[10px] font-medium uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          vị trí
        </p>
      </div>
    </div>
  )
}

function WaitingRoom() {
  const { eventId } = useParams()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(true)
  const [tick, setTick] = useState(3)
  const sessionId = useRef(getOrCreateSessionId(eventId))

  useEffect(() => {
    eventsApi.get(eventId).then(setEvent).catch(console.error)
  }, [eventId])

  // countdown tick every second for "updates in Xs"
  useEffect(() => {
    if (joining || status?.is_admitted || error) return
    const iv = setInterval(() => setTick((t) => (t <= 1 ? 3 : t - 1)), 1000)
    return () => clearInterval(iv)
  }, [joining, status?.is_admitted, error])

  useEffect(() => {
    let cancelled = false
    let pollInterval = null

    const storeTokenAndRedirect = (token) => {
      if (token) sessionStorage.setItem(`queue_token_${eventId}`, token)
      setTimeout(() => {
        if (!cancelled) navigate(`/seat-map/${eventId}`, { replace: true })
      }, 2200)
    }

    const startPolling = () => {
      pollInterval = setInterval(async () => {
        if (cancelled) return
        try {
          const res = await queueApi.status(eventId, sessionId.current)
          if (cancelled) return
          setStatus(res)
          setTick(3)
          if (res.is_admitted) {
            clearInterval(pollInterval)
            storeTokenAndRedirect(res.access_token)
          }
        } catch (_) { }
      }, 3000)
    }

    const init = async () => {
      try {
        const res = await queueApi.join(eventId, sessionId.current)
        if (cancelled) return
        setStatus(res)
        setJoining(false)
        if (res.is_admitted) storeTokenAndRedirect(res.access_token)
        else startPolling()
      } catch (e) {
        if (!cancelled) { setError(e.message); setJoining(false) }
      }
    }

    init()
    return () => { cancelled = true; clearInterval(pollInterval) }
  }, [eventId, navigate])

  const position = status?.position ?? null
  const total = status?.total_in_queue ?? null
  const progressPct = position != null && total != null && total > 0
    ? Math.round(((total - position) / total) * 100)
    : 0

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'

  // ── Joining skeleton ─────────────────────────────────────────────────────────
  if (joining) {
    return (
      <div className={`${bg} flex min-h-[60vh] items-center justify-center`}>
        <div className={`mx-auto w-full max-w-md rounded-2xl border p-10 text-center shadow-xl ${card}`}>
          <div className="flex justify-center">
            <RingSpinner color={isDark ? '#38bdf8' : '#0ea5e9'} />
          </div>
          <p className={`mt-5 text-sm font-medium ${muted}`}>Đang tham gia hàng chờ…</p>
          <PulseDots isDark={isDark} />
        </div>
      </div>
    )
  }

  return (
    <div className={`${bg} min-h-[70vh]`}>
      <section className="mx-auto max-w-lg px-4 py-14 md:px-6">

        {/* ── Header ── */}
        <div className="mb-6 text-center">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest ${isDark ? 'border-sky-800 bg-sky-950/80 text-sky-400' : 'border-sky-200 bg-sky-50 text-sky-600'
            }`}>
            <span className={`h-1.5 w-1.5 animate-pulse rounded-full ${status?.is_admitted ? 'bg-emerald-400' : 'bg-sky-400'}`} />
            Phòng chờ
          </span>
          <h1 className={`mt-3 text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {event?.title || 'Hàng chờ ảo'}
          </h1>
          {event?.venue_name && (
            <p className={`mt-1 text-sm ${muted}`}>{event.venue_name}</p>
          )}
        </div>

        {/* ── Card ── */}
        <div className={`overflow-hidden rounded-2xl border shadow-xl ${card}`}>

          {/* Error */}
          {error && (
            <div className={`p-8 text-center`}>
              <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${isDark ? 'bg-rose-500/10' : 'bg-rose-50'}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
              </div>
              <p className={`mt-4 text-sm font-medium ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{error}</p>
              <Link
                to={`/events/${eventId}`}
                className={`mt-5 inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
              >
                ← Quay lại sự kiện
              </Link>
            </div>
          )}

          {/* Admitted */}
          {!error && status?.is_admitted && (
            <div className="p-8 text-center">
              {/* success ring */}
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <div className={`absolute inset-0 animate-ping rounded-full opacity-20 ${isDark ? 'bg-emerald-400' : 'bg-emerald-500'}`}
                  style={{ animationDuration: '1.4s' }} />
                <div className={`flex h-20 w-20 items-center justify-center rounded-full ${isDark ? 'bg-emerald-500/15' : 'bg-emerald-50'}`}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>
              <h2 className={`mt-5 text-xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Bạn đã được vào!
              </h2>
              <p className={`mt-2 text-sm ${muted}`}>Đang chuyển đến trang chọn ghế…</p>
              <div className={`mt-5 h-1 w-full overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full animate-[grow_2.2s_ease-out_forwards] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400"
                  style={{ width: 0 }} />
              </div>
            </div>
          )}

          {/* Waiting */}
          {!error && !status?.is_admitted && (
            <>
              {/* progress ring */}
              <div className={`px-8 pt-8 pb-6 text-center border-b ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <QueueRing position={position} total={total} pct={progressPct} isDark={isDark} />

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className={muted}>Tiến độ hàng chờ</span>
                    <span className={`font-semibold tabular-nums ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{progressPct}%</span>
                  </div>
                  <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-700 ease-out"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* info box */}
              <div className="px-6 py-5 space-y-3">
                <div className={`flex items-start gap-3 rounded-xl p-3.5 ${isDark ? 'bg-slate-800/60' : 'bg-slate-50'}`}>
                  <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white border border-slate-200'}`}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={isDark ? 'text-sky-400' : 'text-sky-500'}>
                      <circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 2" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Vui lòng đợi</p>
                    <p className={`mt-0.5 text-xs leading-relaxed ${muted}`}>
                      {status?.message || 'Vị trí của bạn được cập nhật tự động mỗi 3 giây.'}
                    </p>
                  </div>
                </div>

                {/* live update indicator */}
                <div className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 ${isDark ? 'bg-slate-800/40' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                    <span className={`text-xs ${muted}`}>Cập nhật sau</span>
                  </div>
                  <span className={`tabular-nums text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {tick}s
                  </span>
                </div>
              </div>

              <div className={`border-t px-6 py-4 text-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <Link
                  to={`/events/${eventId}`}
                  className={`text-xs font-medium transition-colors ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-700'}`}
                >
                  ← Quay lại sự kiện
                </Link>
              </div>
            </>
          )}
        </div>

        {/* disclaimer */}
        <p className={`mt-5 text-center text-xs leading-relaxed ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
          Đừng đóng tab này - vị trí hàng chờ của bạn sẽ bị mất nếu bạn rời khỏi trang.
        </p>
      </section>
    </div>
  )
}

export default WaitingRoom