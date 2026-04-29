import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const AuthContext = createContext(null)

const STORAGE_USER_KEY = 'ticketrush_user'
const STORAGE_USERS_KEY = 'ticketrush_users'
const STORAGE_TOKEN_KEY = 'ticketrush_token'
const STORAGE_RESET_REQUESTS_KEY = 'ticketrush_reset_requests'

const demoUsers = [
  {
    id: 1,
    full_name: 'Nguyen Van A',
    email: 'a@mail.com',
    phone: '0901234567',
    dob: '2000-01-01',
    gender: 'male',
    username: 'nutrimate',
    password: 'Pass@123',
    role: 'customer',
  },
  {
    id: 2,
    full_name: 'Admin User',
    email: 'admin@ticketrush.com',
    phone: '',
    dob: '',
    gender: 'other',
    username: 'admin',
    password: 'Admin@123',
    role: 'admin',
  },
]

function loadUsers() {
  const raw = localStorage.getItem(STORAGE_USERS_KEY)
  if (!raw) return demoUsers

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length ? parsed : demoUsers
  } catch {
    return demoUsers
  }
}

function loadUser() {
  const raw = localStorage.getItem(STORAGE_USER_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function loadResetRequests() {
  const raw = localStorage.getItem(STORAGE_RESET_REQUESTS_KEY)
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)
  const [users, setUsers] = useState(loadUsers)
  const [resetRequests, setResetRequests] = useState(loadResetRequests)

  useEffect(() => {
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users))
  }, [users])

  useEffect(() => {
    localStorage.setItem(STORAGE_RESET_REQUESTS_KEY, JSON.stringify(resetRequests))
  }, [resetRequests])

  const login = async ({ username, password }) => {
    const matchedUser = users.find(
      (entry) => entry.username === username && entry.password === password,
    )

    if (!matchedUser) {
      throw new Error('Incorrect username or password!')
    }

    const safeUser = {
      id: matchedUser.id,
      full_name: matchedUser.full_name,
      email: matchedUser.email,
      username: matchedUser.username,
      role: matchedUser.role,
    }

    setUser(safeUser)
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser))
    localStorage.setItem(STORAGE_TOKEN_KEY, `mock-token-${matchedUser.id}`)

    return safeUser
  }

  const register = async (payload) => {
    const exists = users.some(
      (entry) => entry.username === payload.username || entry.email === payload.email,
    )

    if (exists) {
      throw new Error('Username already exists')
    }

    const nextUser = {
      id: users.length + 1,
      ...payload,
      role: 'customer',
    }

    const safeUser = {
      id: nextUser.id,
      full_name: nextUser.full_name,
      email: nextUser.email,
      username: nextUser.username,
      role: nextUser.role,
    }

    setUsers((prev) => [...prev, nextUser])
    setUser(safeUser)
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(safeUser))
    localStorage.setItem(STORAGE_TOKEN_KEY, `mock-token-${nextUser.id}`)

    return safeUser
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_USER_KEY)
    localStorage.removeItem(STORAGE_TOKEN_KEY)
  }

  const requestPasswordReset = async (email) => {
    const normalizedEmail = email.trim().toLowerCase()
    const matchedUser = users.find((entry) => entry.email?.toLowerCase() === normalizedEmail)

    if (!matchedUser) {
      return {
        found: false,
        resetLink: '',
      }
    }

    const token = `${matchedUser.id}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
    const request = {
      token,
      email: matchedUser.email,
      userId: matchedUser.id,
      used: false,
      createdAt: new Date().toISOString(),
    }

    setResetRequests((prev) => [...prev.filter((item) => item.email !== matchedUser.email), request])

    return {
      found: true,
      resetLink: `${window.location.origin}/reset-password/${token}`,
    }
  }

  const verifyResetToken = (token) => {
    return resetRequests.find((item) => item.token === token && !item.used) || null
  }

  const resetPassword = async ({ token, password }) => {
    const request = verifyResetToken(token)

    if (!request) {
      throw new Error('Reset link is invalid or has already been used.')
    }

    setUsers((prev) =>
      prev.map((entry) =>
        entry.id === request.userId
          ? {
              ...entry,
              password,
            }
          : entry,
      ),
    )

    setResetRequests((prev) =>
      prev.map((item) =>
        item.token === token
          ? {
              ...item,
              used: true,
              usedAt: new Date().toISOString(),
            }
          : item,
      ),
    )

    return true
  }

  const value = useMemo(
    () => ({
      user,
      users,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      requestPasswordReset,
      verifyResetToken,
      resetPassword,
    }),
    [user, users, resetRequests],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
