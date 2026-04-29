import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

function ForgotPassword() {
  const { requestPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [resetLink, setResetLink] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setResetLink('')
    setLoading(true)

    try {
      const result = await requestPasswordReset(email)
      if (result.found) {
        setMessage('We sent a password reset link to your email address.')
        setResetLink(result.resetLink)
      } else {
        setMessage('If the email exists in our system, a reset link has been prepared.')
      }
    } catch (error) {
      setMessage(error.message || 'Unable to process password reset request.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Forgot password</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Reset your password</h1>
          <p className="mt-2 text-sm text-slate-600">Enter your email and we will generate a reset link.</p>
        </div>

        {message && (
          <div className="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-700">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="forgot-email" className="mb-2 block text-sm font-medium text-slate-600">
              Email
            </label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none placeholder-slate-400 focus:border-sky-400/50 focus:ring-2 focus:ring-sky-400/50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-linear-to-r from-sky-500 to-cyan-400 py-2.5 font-semibold text-white transition hover:shadow-lg hover:shadow-sky-500/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Sending link...' : 'Send reset link'}
          </button>
        </form>

        {resetLink && (
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-900">Reset link</p>
            <a className="mt-2 block break-all text-sky-600 underline" href={resetLink}>
              {resetLink}
            </a>
            <p className="mt-2 text-xs text-slate-500">
              Demo mode: copy this link or open it to continue to the password reset page.
            </p>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-semibold text-sky-600 transition hover:text-sky-500">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword