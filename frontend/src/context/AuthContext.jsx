import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi } from '../lib/api'

const AuthContext = createContext(null)

const TOKEN_KEY = 'ticketrush_token'
const USER_KEY  = 'ticketrush_user'

function readStoredUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null }
}

export function AuthProvider({ children }) {
  // Restore user synchronously so pages don't flash to /login on refresh
  const [user, setUser] = useState(readStoredUser)
  // authLoading: true while the initial token validation is in-flight
  const [authLoading, setAuthLoading] = useState(true)

  const _setUser = useCallback((u) => {
    setUser(u)
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u))
    else    localStorage.removeItem(USER_KEY)
  }, [])

  // Verify token on mount; clear if expired/invalid
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { _setUser(null); setAuthLoading(false); return }
    authApi.me()
      .then(_setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        _setUser(null)
      })
      .finally(() => setAuthLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = useCallback(async ({ username, password }) => {
    const res = await authApi.login({ username, password })
    localStorage.setItem(TOKEN_KEY, res.access_token)
    _setUser(res.user)
    return res.user
  }, [_setUser])

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload)
    localStorage.setItem(TOKEN_KEY, res.access_token)
    _setUser(res.user)
    return res.user
  }, [_setUser])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    _setUser(null)
  }, [_setUser])

  const updateUser = useCallback((u) => {
    _setUser(u)
  }, [_setUser])

  const value = useMemo(() => ({
    user,
    authLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
    updateUser,
  }), [user, authLoading, login, register, logout, updateUser])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
