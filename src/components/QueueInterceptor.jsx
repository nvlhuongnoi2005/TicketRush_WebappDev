import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueue } from '../context/QueueContext'
import { useAuth } from '../context/AuthContext'

/**
 * QueueInterceptor - Automatically redirects users to Waiting Room
 * when the system is at capacity
 *
 * When you access "/" or "/events/:id", if shouldQueue is true,
 * this will redirect to "/waiting-room/:eventId" (or "/" for home queue)
 */
export function QueueInterceptor({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { shouldQueue, isAdmitted, isInQueue, joinQueue } = useQueue()
  const { user } = useAuth()

  // Pages that should trigger queue bypass check
  const queueablePaths = ['/', '/events', '/seat-map', '/checkout']
  const isQueueablePath = queueablePaths.some((path) => location.pathname.startsWith(path))

  // WaitingRoom and auth pages should never queue
  const isWaitingRoom = location.pathname.startsWith('/waiting-room')
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isAdminPage = location.pathname.startsWith('/admin')

  useEffect(() => {
    // If user is not logged in, don't apply queue logic
    if (!user) return

    // Don't queue on admin pages, auth pages, or if already in waiting room
    if (isAdminPage || isAuthPage || isWaitingRoom) return

    // If on a queueable page and system is at capacity
    if (isQueueablePath && shouldQueue) {
      // If user hasn't been admitted, add them to queue
      if (!isAdmitted) {
        joinQueue()

        // Always redirect to waiting room if not admitted and not waiting room
        const eventMatch = location.pathname.match(/\/(?:events|seat-map|checkout)\/(\d+)/)
        const eventId = eventMatch ? eventMatch[1] : '1'

        navigate(`/waiting-room/${eventId}`, { replace: true })
      }
    }
  }, [shouldQueue, isAdmitted, location.pathname, user, isAdminPage, isAuthPage, isWaitingRoom, isQueueablePath, joinQueue, navigate])

  return children
}
