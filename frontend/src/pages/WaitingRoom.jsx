import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { eventsApi, queueApi } from '../lib/api'
import { useQueue } from '../context/QueueContext'

function WaitingRoom() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { sessionId, hasAccessToken, storeAccessToken } = useQueue()
  const [event, setEvent] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState('')
  const intervalRef = useRef(null)

  useEffect(() => {
    eventsApi.get(eventId).then(setEvent).catch(console.error)
  }, [eventId])

  useEffect(() => {
    // Already admitted with a valid token — go straight to seat map
    if (hasAccessToken(eventId)) {
      navigate(`/seat-map/${eventId}`, { replace: true })
      return
    }

    if (!sessionId) return

    const handleStatus = (s) => {
      setStatus(s)
      if (s.is_admitted && s.access_token) {
        clearInterval(intervalRef.current)
        storeAccessToken(eventId, s.access_token, s.token_expires_at ?? null)
        navigate(`/seat-map/${eventId}`, { replace: true })
      }
    }

    queueApi.join(eventId, sessionId)
      .then(handleStatus)
      .catch((err) => setError(err.message))

    intervalRef.current = setInterval(() => {
      queueApi.status(eventId, sessionId)
        .then(handleStatus)
        .catch((err) => setError(err.message))
    }, 2000)

    return () => clearInterval(intervalRef.current)
  }, [eventId, sessionId])

  const isAdmitted = status?.is_admitted ?? false

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Waiting room</p>
          <h1 className="mt-3 text-3xl font-semibold">{event?.title || 'Event queue'}</h1>

          {error && (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
              {error}
            </div>
          )}

          {isAdmitted ? (
            <div className="mt-8 space-y-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
              <p className="text-lg font-semibold text-emerald-300">You have been admitted!</p>
              <p className="text-sm text-slate-300">Redirecting to seat selection...</p>
            </div>
          ) : (
            <>
              <div className="mt-8 flex items-center justify-center gap-3">
                <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.3s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400 [animation-delay:-0.15s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" />
              </div>

              <p className="mt-6 text-lg text-slate-300">
                You are currently in position{' '}
                <span className="font-semibold text-cyan-300">{status?.position ?? '...'}</span>
                {status?.total_in_queue ? (
                  <span className="text-slate-400"> of {status.total_in_queue}</span>
                ) : null}
              </p>

              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-300">
                <p className="font-medium text-white">Please wait...</p>
                <p className="mt-2">
                  {status?.message || 'Your position will be updated every few seconds. You will be automatically redirected when admitted.'}
                </p>
              </div>
            </>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!isAdmitted && (
              <Link
                to={`/events/${eventId}`}
                className="rounded-full border border-white/15 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Back to event
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default WaitingRoom
