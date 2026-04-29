import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { authApi } from '../lib/api'

function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.')
      return
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    try {
      await authApi.resetPassword({ reset_token: token, new_password: password })
      navigate('/login', { state: { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.' } })
    } catch (err) {
      setError(err.message || 'Link đặt lại không hợp lệ hoặc đã hết hạn.')
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
            <p className="text-sm text-slate-400">Đặt lại mật khẩu</p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4">
              <p className="text-sm text-rose-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Mật khẩu mới</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tối thiểu 8 ký tự"
                required
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
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
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-400 to-blue-400 py-2.5 font-semibold text-slate-950 transition hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
            >
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </form>

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

export default ResetPassword
