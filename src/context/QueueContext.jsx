import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const QueueContext = createContext(null)

const SESSION_KEY = 'ticketrush_session_id'
const TOKENS_KEY = 'ticketrush_queue_tokens'

function getOrCreateSessionId() {
  let id = localStorage.getItem(SESSION_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(SESSION_KEY, id)
  }
  return id
}

function normalizeUTC(s) {
  if (!s || s.endsWith('Z') || s.includes('+')) return s
  return s + 'Z'
}

function loadStoredTokens() {
  try {
    const raw = JSON.parse(sessionStorage.getItem(TOKENS_KEY)) || {}
    // Migrate any previously stored entries that lack 'Z' on their expiresAt
    let changed = false
    for (const key of Object.keys(raw)) {
      const entry = raw[key]
      const fixed = normalizeUTC(entry?.expiresAt)
      if (fixed !== entry?.expiresAt) { raw[key] = { ...entry, expiresAt: fixed }; changed = true }
    }
    if (changed) sessionStorage.setItem(TOKENS_KEY, JSON.stringify(raw))
    return raw
  } catch {
    return {}
  }
}

export function QueueProvider({ children }) {
  const [sessionId] = useState(getOrCreateSessionId)
  const [accessTokens, setAccessTokens] = useState(loadStoredTokens)

  const _isValid = (entry) => {
    if (!entry) return false
    if (entry.expiresAt && new Date(entry.expiresAt) <= new Date()) return false
    return true
  }

  const hasAccessToken = useCallback((eventId) => {
    return _isValid(accessTokens[String(eventId)])
  }, [accessTokens])

  // expiresAt is an ISO string from token_expires_at (may be naive UTC without 'Z')
  const storeAccessToken = useCallback((eventId, token, expiresAt = null) => {
    // Backend sends naive UTC datetimes — append 'Z' so JS parses as UTC, not local time
    const normalized = expiresAt && !expiresAt.endsWith('Z') && !expiresAt.includes('+')
      ? expiresAt + 'Z'
      : expiresAt
    setAccessTokens((prev) => {
      const next = { ...prev, [String(eventId)]: { token, expiresAt: normalized } }
      sessionStorage.setItem(TOKENS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const getAccessToken = useCallback((eventId) => {
    const entry = accessTokens[String(eventId)]
    return _isValid(entry) ? entry.token : null
  }, [accessTokens])

  // Returns Date object or null
  const getTokenExpiry = useCallback((eventId) => {
    const entry = accessTokens[String(eventId)]
    if (!entry?.expiresAt) return null
    return new Date(entry.expiresAt)
  }, [accessTokens])

  const clearAccessToken = useCallback((eventId) => {
    setAccessTokens((prev) => {
      const next = { ...prev }
      delete next[String(eventId)]
      sessionStorage.setItem(TOKENS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ sessionId, hasAccessToken, storeAccessToken, getAccessToken, getTokenExpiry, clearAccessToken }),
    [sessionId, hasAccessToken, storeAccessToken, getAccessToken, getTokenExpiry, clearAccessToken],
  )

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>
}

export function useQueue() {
  const ctx = useContext(QueueContext)
  if (!ctx) throw new Error('useQueue must be used within QueueProvider')
  return ctx
}
