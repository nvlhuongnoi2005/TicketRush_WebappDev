import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.au { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
.ai { animation: fadeIn 0.4s ease both; }
.d1 { animation-delay: 0.05s; }
.d2 { animation-delay: 0.12s; }
.d3 { animation-delay: 0.19s; }
.d4 { animation-delay: 0.26s; }
.d5 { animation-delay: 0.33s; }
`

// ─── Input field ───────────────────────────────────────────────────────────────
function Field({ id, label, hint, type = 'text', value, onChange, placeholder, required, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {label}
        </label>
        {hint}
      </div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none placeholder-slate-400 transition focus:border-sky-400/60 focus:bg-white focus:ring-2 focus:ring-sky-400/20"
        />
        {children}
      </div>
    </div>
  )
}

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const successMessage = location.state?.message || ''
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
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
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.')
      setLoading(false)
    }
  }

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7fb] px-4 py-12">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-sky-400/8 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-400/8 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-[400px]">

          {/* ── Logo ── */}
          <div className="au mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/25">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 9a1 1 0 0 1 0-2V6h20v1a1 1 0 0 1 0 2v1a1 1 0 0 1 0 2v1H2v-1a1 1 0 0 1 0-2V9Z" />
                <line x1="9" y1="6" x2="9" y2="18" strokeDasharray="2 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">TicketRush</h1>
            <p className="mt-1 text-sm text-slate-400">Đăng nhập để tiếp tục</p>
          </div>

          {/* ── Card ── */}
          <div className="au d1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            {/* top accent */}
            <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500" />

            <div className="p-7">

              {/* success */}
              {successMessage && (
                <div className="au mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#10b981" strokeWidth="1.8">
                    <circle cx="8" cy="8" r="6" /><path d="M5 8l2 2 4-4" />
                  </svg>
                  <p className="text-xs leading-relaxed text-emerald-700">{successMessage}</p>
                </div>
              )}

              {/* error */}
              {error && (
                <div className="au mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#f43f5e" strokeWidth="1.8">
                    <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs leading-relaxed text-rose-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="au d2">
                  <Field
                    id="username" label="Tên đăng nhập"
                    value={username} onChange={e => setUsername(e.target.value)}
                    placeholder="nguyenvana" required
                  />
                </div>

                <div className="au d3">
                  <Field
                    id="password" label="Mật khẩu"
                    type={showPw ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    hint={
                      <Link to="/forgot-password" className="text-[11px] font-medium text-sky-500 transition hover:text-sky-400">
                        Quên mật khẩu?
                      </Link>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                          <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </Field>
                </div>

                <div className="au d4 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-92 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                        </svg>
                        Đang đăng nhập…
                      </span>
                    ) : 'Đăng nhập'}
                  </button>
                </div>
              </form>

              {/* divider */}
              <div className="au d5 my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[11px] font-medium text-slate-300">HOẶC</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <p className="au d5 text-center text-xs text-slate-500">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-semibold text-sky-600 transition hover:text-sky-500">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>

          <p className="au d5 mt-6 text-center text-[11px] text-slate-400">
            Bằng cách đăng nhập, bạn đồng ý với{' '}
            <a href="#" className="underline underline-offset-2 hover:text-slate-600">Điều khoản dịch vụ</a>
          </p>
        </div>
      </div>
    </>
  )
}

export default Login