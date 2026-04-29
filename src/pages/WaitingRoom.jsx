import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { getEventById } from '../data/mockData'
import { useQueue } from '../context/QueueContext'

function WaitingRoom() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const event = getEventById(eventId)
  const { userPosition, isAdmitted, getAccess, activeUsers, CAPACITY_CONFIG } = useQueue()
  const [displayPosition, setDisplayPosition] = useState(userPosition)

  const accessToken = useMemo(() => `MOCK-${eventId}-${String(eventId).padStart(4, '0')}`, [eventId])

  // Auto-redirect when admitted
  useEffect(() => {
    if (isAdmitted) {
      // Get access to skip queue on next visit
      getAccess()

      // Wait a bit for UI to show admission message
      const timer = setTimeout(() => {
        navigate(`/seat-map/${eventId}`, { replace: true })
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isAdmitted, eventId, navigate, getAccess])

  // Update display position
  useEffect(() => {
    if (userPosition) {
      setDisplayPosition(userPosition)
    }
  }, [userPosition])

  const capacityPercent = Math.min(Math.round((activeUsers / CAPACITY_CONFIG.NORMAL_CAPACITY) * 100), 100)

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Waiting room</p>
          <h1 className="mt-3 text-3xl font-semibold">{event?.title || 'Event queue'}</h1>

          {isAdmitted ? (
            <div className="mt-8 space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-lg font-semibold text-emerald-700">✓ You have been admitted!</p>
              <p className="text-sm text-slate-600">Redirecting to seat selection...</p>
            </div>
          ) : (
            <>
              <p className="mt-6 text-lg text-slate-600">
                You are currently in position{' '}
                <span className="font-semibold text-sky-700">{displayPosition || '...'}</span> in the queue.
              </p>

              <div className="mt-8 space-y-3">
                <div className="text-sm text-slate-500">System capacity: {capacityPercent}%</div>

                <div className="h-4 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <p className="font-medium text-slate-900">⏳ Please wait...</p>
                <p className="mt-2">
                  Your position will be updated automatically. When you reach the front of the queue, you will be admitted.
                </p>
              </div>
            </>
          )}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p>
              Access token: <span className="font-mono text-sky-700">{accessToken}</span>
            </p>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {!isAdmitted && (
              <Link
                to={`/events/${eventId}`}
                className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-900 transition hover:bg-slate-100"
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

