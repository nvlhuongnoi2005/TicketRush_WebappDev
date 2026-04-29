import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ticketrush_token'
const USER_KEY = 'ticketrush_user'

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [loading, setLoading] = useState(false)

  // Sync user info từ backend khi có token (refresh page)
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || user) return
    authApi.me()
      .then((u) => { setUser(u); localStorage.setItem(USER_KEY, JSON.stringify(u)) })
      .catch(() => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) })
  }, [])

  const login = async ({ username, password }) => {
    setLoading(true)
    try {
      const data = await authApi.login({ username, password })
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload) => {
    setLoading(true)
    // Convert dob: "yyyy-mm-dd" → "dd/mm/yyyy" (format backend expects)
    const body = { ...payload }
    if (body.dob && body.dob.includes('-') && body.dob.length === 10) {
      const [y, m, d] = body.dob.split('-')
      body.dob = `${d}/${m}/${y}`
    }
    try {
      const data = await authApi.register(body)
      localStorage.setItem(TOKEN_KEY, data.access_token)
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
