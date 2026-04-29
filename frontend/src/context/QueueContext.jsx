import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const QueueContext = createContext(null)

/**
 * Queue capacity thresholds
 * Khi active users > threshold, redirect vào waiting room
 */
const CAPACITY_CONFIG = {
  NORMAL_CAPACITY: 50, // Max concurrent users on platform
  // Raised warning threshold to avoid forcing the demo into queue mode
  // during development. Set to a high value so queuing doesn't trigger.
  WARNING_THRESHOLD: 1000,
  QUEUE_SIZE_LIMIT: 500, // Max people in queue
}

export function QueueProvider({ children }) {
  // Simulated concurrent users on platform (in real app, from backend)
  // Force high value for demo - normally starts at 8
  const [activeUsers, setActiveUsers] = useState(42)
  const [userQueue, setUserQueue] = useState([])
  const [grantedUsers, setGrantedUsers] = useState(new Set())
  const [userPosition, setUserPosition] = useState(null)
  const [currentUserId] = useState(() => `user-${Date.now()}`)

  // Simulate real-time active users changing
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveUsers((prev) => {
        const change = Math.floor(Math.random() * 7) - 2 // -2 to +4
        const newValue = Math.max(5, Math.min(prev + change, 100))
        return newValue
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  // Simulate queue processing - admit users every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setUserQueue((prevQueue) => {
        if (prevQueue.length === 0) return prevQueue

        // Admit 5 users at a time
        const admitCount = Math.min(5, prevQueue.length)
        const toAdmit = prevQueue.slice(0, admitCount)
        const remaining = prevQueue.slice(admitCount)

        setGrantedUsers((prev) => new Set([...prev, ...toAdmit]))

        return remaining
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Check if user needs to queue
  const shouldQueue = activeUsers >= CAPACITY_CONFIG.WARNING_THRESHOLD

  // Join user to queue if they shouldn't have access yet
  const joinQueue = useCallback(() => {
    if (grantedUsers.has(currentUserId)) return // Already admitted

    setUserQueue((prev) => {
      if (prev.includes(currentUserId)) return prev // Already in queue
      return [...prev, currentUserId]
    })

    // Update position
    setUserPosition(userQueue.length + 1)
  }, [currentUserId, grantedUsers, userQueue.length])

  // Remove user from queue (when admitted)
  const leaveQueue = useCallback(() => {
    setUserQueue((prev) => prev.filter((id) => id !== currentUserId))
    setUserPosition(null)
  }, [currentUserId])

  // Get access (called after user is admitted from waiting room)
  const getAccess = useCallback(() => {
    if (!grantedUsers.has(currentUserId)) {
      setGrantedUsers((prev) => new Set([...prev, currentUserId]))
    }
    leaveQueue()
  }, [currentUserId, grantedUsers, leaveQueue])

  // Release access (called on logout or leave)
  const releaseAccess = useCallback(() => {
    setGrantedUsers((prev) => {
      const newSet = new Set(prev)
      newSet.delete(currentUserId)
      return newSet
    })
    setUserQueue((prev) => prev.filter((id) => id !== currentUserId))
    setUserPosition(null)
  }, [currentUserId])

  // Update position in queue
  useEffect(() => {
    if (userQueue.length === 0) {
      setUserPosition(null)
      return
    }

    const idx = userQueue.indexOf(currentUserId)
    if (idx >= 0) {
      setUserPosition(idx + 1)
    }
  }, [userQueue, currentUserId])

  const value = useMemo(
    () => ({
      // State
      activeUsers,
      userQueue,
      grantedUsers,
      userPosition,
      currentUserId,
      shouldQueue,
      isAdmitted: grantedUsers.has(currentUserId),
      isInQueue: userQueue.includes(currentUserId),

      // Config
      CAPACITY_CONFIG,

      // Actions
      joinQueue,
      leaveQueue,
      getAccess,
      releaseAccess,
    }),
    [activeUsers, userQueue, grantedUsers, userPosition, currentUserId, shouldQueue],
  )

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
}

export function useQueue() {
  const context = useContext(QueueContext)
  if (!context) {
    throw new Error('useQueue must be used within QueueProvider')
  }
  return context
}
