import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '../lib/api'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [devResetUrl, setDevResetUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.forgotPassword({ email })
      if (res?.dev_reset_url) setDevResetUrl(res.dev_reset_url)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">TicketRush</h1>
            <p className="text-sm text-slate-400">Quên mật khẩu</p>
          </div>

          {sent ? (
            <div className="space-y-5 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/15">
                <svg className="h-8 w-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0-9.75 6.75L2.25 6.75" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Kiểm tra hộp thư của bạn</p>
                <p className="mt-2 text-sm text-slate-400">
                  Nếu <span className="text-cyan-300">{email}</span> tồn tại trong hệ thống,
                  chúng tôi đã gửi link đặt lại mật khẩu. Link có hiệu lực trong 30 phút.
                </p>
              </div>
              {devResetUrl && (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4 text-left">
                  <p className="mb-2 text-xs font-semibold text-yellow-400 uppercase tracking-wider">
                    DEV MODE — Reset link (SMTP not configured)
                  </p>
                  <a
                    href={devResetUrl}
                    className="break-all text-xs text-cyan-400 underline underline-offset-2 hover:text-cyan-300"
                  >
                    {devResetUrl}
                  </a>
                </div>
              )}
              <p className="text-xs text-slate-500">
                Không thấy email? Kiểm tra thư mục Spam hoặc{' '}
                <button
                  onClick={() => { setSent(false); setEmail(''); setDevResetUrl('') }}
                  className="text-cyan-400 underline-offset-2 hover:underline"
                >
                  thử lại
                </button>.
              </p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              <p className="mb-6 text-sm text-slate-400">
                Nhập địa chỉ email đã đăng ký. Chúng tôi sẽ gửi link đặt lại mật khẩu vào hộp thư của bạn.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@example.com"
                    required
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-400 py-2.5 font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-cyan-400 transition hover:text-cyan-300">
              Quay lại đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
