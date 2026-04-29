import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { verifyResetToken, resetPassword } = useAuth()
  const resetRequest = useMemo(() => verifyResetToken(token), [token, verifyResetToken])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await resetPassword({ token, password })
      setMessage('Password updated successfully. Redirecting to login...')
      setTimeout(() => navigate('/login'), 1500)
    } catch (err) {
      setError(err.message || 'Reset link is invalid or expired.')
    } finally {
      setLoading(false)
    }
  }

  if (!resetRequest) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-slate-900">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Reset password</p>
          <h1 className="mt-2 text-3xl font-bold">Invalid reset link</h1>
          <p className="mt-3 text-sm text-slate-600">This reset link has expired or has already been used.</p>
          <Link to="/forgot-password" className="mt-6 inline-flex rounded-full bg-sky-500 px-5 py-3 font-semibold text-white">
            Request a new link
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Reset password</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Set a new password</h1>
          <p className="mt-2 text-sm text-slate-600">For {resetRequest.email}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-slate-600">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/50"
              required
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-slate-600">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-linear-to-r from-sky-500 to-cyan-400 py-2.5 font-semibold text-white transition hover:shadow-lg hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Update password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-semibold text-sky-600 transition hover:text-sky-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword