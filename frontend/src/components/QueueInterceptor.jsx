import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { eventsApi } from '../lib/api'

const SEAT_MAP_RE = /^\/seat-map\/(\d+)$/

export function QueueInterceptor({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const match = location.pathname.match(SEAT_MAP_RE)
    if (!match) return

    const eventId = match[1]
    // If the user was already admitted (token stored after WaitingRoom), allow access
    const token = sessionStorage.getItem(`queue_token_${eventId}`)
    if (token) return

    eventsApi.get(eventId)
      .then((event) => {
        if (event.queue_enabled) {
          navigate(`/waiting-room/${eventId}`, { replace: true })
        }
      })
      .catch(() => {})
  }, [location.pathname, navigate])

  return children
}
