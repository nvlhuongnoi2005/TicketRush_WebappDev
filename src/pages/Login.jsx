import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login({ username, password })
      navigate('/')
    } catch (err) {
      setError(err.message || 'Incorrect username or password!')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-slate-900">TicketRush</h1>
            <p className="text-sm text-slate-600">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="mb-2 block text-sm font-medium text-slate-300">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition placeholder-slate-400 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/50"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none transition placeholder-slate-400 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/50"
                required
              />
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-sky-600 transition hover:text-sky-500">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-linear-to-r from-sky-500 to-cyan-400 py-2.5 font-semibold text-white transition hover:shadow-lg hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'SIGN IN'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-500">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-600">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-sky-600 transition hover:text-sky-500">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}

export default Login
