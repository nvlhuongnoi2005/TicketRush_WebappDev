import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'

function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState('request') // 'request' | 'reset'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequest = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await authApi.forgotPassword({ username, email })
      setResetToken(data.reset_token)
      setMessage(`Mã đặt lại: ${data.reset_token}`)
      setStep('reset')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp')
      return
    }
    if (newPassword.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword({ reset_token: resetToken, new_password: newPassword })
      navigate('/login', { state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' } })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">TicketRush</h1>
            <p className="text-sm text-slate-400">
              {step === 'request' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {message && step === 'reset' && (
            <div className="mb-6 rounded-lg border border-cyan-400/30 bg-cyan-400/10 p-4 text-sm text-cyan-200">
              <p className="font-medium">Mã đặt lại mật khẩu của bạn:</p>
              <p className="mt-1 break-all font-mono text-xs text-white">{resetToken}</p>
              <p className="mt-2 text-slate-300">Điền mã này vào ô bên dưới để đặt lại mật khẩu.</p>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequest} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Tên đăng nhập"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Email đã đăng ký</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-linear-to-r from-cyan-400 to-blue-400 py-2.5 font-semibold text-slate-950 transition hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Đang xử lý...' : 'LẤY MÃ ĐẶT LẠI'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Mã đặt lại</label>
                <input
                  type="text"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste mã ở trên vào đây"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-xs text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Tối thiểu 8 ký tự"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Xác nhận mật khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-linear-to-r from-cyan-400 to-blue-400 py-2.5 font-semibold text-slate-950 transition hover:shadow-lg disabled:opacity-50"
              >
                {loading ? 'Đang đặt lại...' : 'ĐẶT LẠI MẬT KHẨU'}
              </button>
            </form>
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
