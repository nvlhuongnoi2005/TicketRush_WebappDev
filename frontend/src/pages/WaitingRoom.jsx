import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { eventsApi, queueApi } from '../lib/api'

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

function WaitingRoom() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const [joining, setJoining] = useState(true)
  const sessionId = useRef(getOrCreateSessionId(eventId))

  useEffect(() => {
    eventsApi.get(eventId).then(setEvent).catch(console.error)
  }, [eventId])

  useEffect(() => {
    let cancelled = false
    let pollInterval = null

    const storeTokenAndRedirect = (token) => {
      if (token) sessionStorage.setItem(`queue_token_${eventId}`, token)
      setTimeout(() => {
        if (!cancelled) navigate(`/seat-map/${eventId}`, { replace: true })
      }, 2000)
    }

    const startPolling = () => {
      pollInterval = setInterval(async () => {
        if (cancelled) return
        try {
          const res = await queueApi.status(eventId, sessionId.current)
          if (cancelled) return
          setStatus(res)
          if (res.is_admitted) {
            clearInterval(pollInterval)
            storeTokenAndRedirect(res.access_token)
          }
        } catch (_) {}
      }, 3000)
    }

    const init = async () => {
      try {
        const res = await queueApi.join(eventId, sessionId.current)
        if (cancelled) return
        setStatus(res)
        setJoining(false)
        if (res.is_admitted) {
          storeTokenAndRedirect(res.access_token)
        } else {
          startPolling()
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setJoining(false)
        }
      }
    }

    init()
    return () => {
      cancelled = true
      clearInterval(pollInterval)
    }
  }, [eventId, navigate])

  const position = status?.position ?? null
  const total = status?.total_in_queue ?? null
  const progressPct =
    position != null && total != null && total > 0
      ? Math.round(((total - position) / total) * 100)
      : 0

  if (joining) {
    return (
      <div className="bg-slate-50 text-slate-900">
        <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
            <p className="text-slate-500">Đang tham gia hàng chờ...</p>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Phòng chờ</p>
          <h1 className="mt-3 text-3xl font-semibold">{event?.title || 'Hàng chờ ảo'}</h1>

          {error ? (
            <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-6">
              <p className="text-rose-600">{error}</p>
              <Link
                to={`/events/${eventId}`}
                className="mt-4 inline-flex rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Quay lại sự kiện
              </Link>
            </div>
          ) : status?.is_admitted ? (
            <div className="mt-8 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-lg font-semibold text-emerald-700">✓ Bạn đã được vào!</p>
              <p className="text-sm text-slate-600">Đang chuyển đến trang chọn ghế...</p>
            </div>
          ) : (
            <>
              <p className="mt-6 text-lg text-slate-600">
                Bạn đang ở vị trí thứ{' '}
                <span className="font-semibold text-sky-700">{position ?? '...'}</span>
                {total != null && (
                  <span> / {total}</span>
                )}{' '}
                trong hàng đợi.
              </p>

              <div className="mt-8 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Tiến độ hàng chờ</span>
                  <span>{progressPct}%</span>
                </div>
                <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">⏳ Vui lòng đợi...</p>
                <p className="mt-2">
                  {status?.message || 'Vị trí của bạn sẽ được cập nhật tự động mỗi 3 giây.'}
                </p>
              </div>

              <div className="mt-8">
                <Link
                  to={`/events/${eventId}`}
                  className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Quay lại sự kiện
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default WaitingRoom
