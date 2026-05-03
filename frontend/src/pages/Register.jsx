import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const KEYFRAMES = `
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.au { animation: fadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
.d1 { animation-delay: 0.05s; }
.d2 { animation-delay: 0.10s; }
.d3 { animation-delay: 0.15s; }
.d4 { animation-delay: 0.20s; }
.d5 { animation-delay: 0.25s; }
.d6 { animation-delay: 0.30s; }
.d7 { animation-delay: 0.35s; }
`

// ─── Validation ────────────────────────────────────────────────────────────────
function validateRegistration(formData) {
  if (!formData.full_name.trim()) return 'Vui lòng nhập họ và tên.'
  if (formData.full_name.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.'
  if (!formData.email.trim()) return 'Vui lòng nhập email.'
  if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) return 'Email không hợp lệ.'
  if (formData.phone && !/^\d{9,11}$/.test(formData.phone.trim())) return 'Số điện thoại phải có 9-11 chữ số.'
  if (formData.dob && Number.isNaN(Date.parse(formData.dob))) return 'Ngày sinh không hợp lệ.'
  if (!formData.username.trim()) return 'Vui lòng nhập tên đăng nhập.'
  if (!/^[a-zA-Z0-9_]{4,20}$/.test(formData.username.trim())) return 'Tên đăng nhập 4-20 ký tự, chỉ gồm chữ, số hoặc dấu gạch dưới.'
  if (!formData.password) return 'Vui lòng nhập mật khẩu.'
  if (formData.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(formData.password))
    return 'Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.'
  if (formData.password !== formData.confirmPassword) return 'Mật khẩu xác nhận không khớp.'
  return ''
}

// ─── Password strength ─────────────────────────────────────────────────────────
function pwStrength(pw) {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}
const STRENGTH_LABEL = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh']
const STRENGTH_COLOR = ['', '#f43f5e', '#f59e0b', '#38bdf8', '#10b981']

// ─── Shared input style ────────────────────────────────────────────────────────
const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 outline-none placeholder-slate-400 transition focus:border-sky-400/60 focus:bg-white focus:ring-2 focus:ring-sky-400/20'

function Label({ htmlFor, children, optional }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-500">
      {children}
      {optional && <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] normal-case tracking-normal text-slate-400">tuỳ chọn</span>}
    </label>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      <div className="h-px flex-1 bg-slate-100" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{children}</span>
      <div className="h-px flex-1 bg-slate-100" />
    </div>
  )
}

function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', dob: '',
    gender: 'male', username: '', password: '', confirmPassword: '',
  })
  const [showPw, setShowPw] = useState(false)
  const [showCpw, setShowCpw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const validationError = validateRegistration(formData)
    if (validationError) { setError(validationError); return }
    setLoading(true)
    try {
      let dob = formData.dob
      if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
        const [y, m, d] = dob.split('-')
        dob = `${d}/${m}/${y}`
      }
      await register({ full_name: formData.full_name, email: formData.email, phone: formData.phone, dob, gender: formData.gender, username: formData.username, password: formData.password })
      navigate('/', { state: { message: 'Đăng ký thành công! Chào mừng bạn.' } })
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
      setLoading(false)
    }
  }

  const strength = pwStrength(formData.password)

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f7fb] px-4 py-12">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -left-40 -top-40 h-[600px] w-[600px] rounded-full bg-sky-400/7 blur-[120px]" />
          <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-400/7 blur-[100px]" />
        </div>

        <div className="relative w-full max-w-[440px]">

          {/* ── Logo ── */}
          <div className="au mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/25">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                <path d="M2 9a1 1 0 0 1 0-2V6h20v1a1 1 0 0 1 0 2v1a1 1 0 0 1 0 2v1H2v-1a1 1 0 0 1 0-2V9Z" />
                <line x1="9" y1="6" x2="9" y2="18" strokeDasharray="2 2" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">TicketRush</h1>
            <p className="mt-1 text-sm text-slate-400">Tạo tài khoản mới</p>
          </div>

          {/* ── Card ── */}
          <div className="au d1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
            <div className="h-0.5 w-full bg-gradient-to-r from-sky-500 via-cyan-400 to-indigo-500" />

            <div className="p-7">

              {/* error */}
              {error && (
                <div className="au mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#f43f5e" strokeWidth="1.8">
                    <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" strokeLinecap="round" />
                  </svg>
                  <p className="text-xs leading-relaxed text-rose-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ── Personal info ── */}
                <div className="au d2">
                  <SectionTitle>Thông tin cá nhân</SectionTitle>
                </div>

                <div className="au d2">
                  <Label htmlFor="full_name">Họ và tên</Label>
                  <input id="full_name" name="full_name" type="text"
                    value={formData.full_name} onChange={handleChange}
                    placeholder="Nguyễn Văn A" required minLength={2}
                    className={inputCls}
                  />
                </div>

                <div className="au d2">
                  <Label htmlFor="email">Email</Label>
                  <input id="email" name="email" type="email"
                    value={formData.email} onChange={handleChange}
                    placeholder="a@mail.com" required
                    className={inputCls}
                  />
                </div>

                <div className="au d2">
                  <Label htmlFor="phone" optional>Số điện thoại</Label>
                  <input id="phone" name="phone" type="tel"
                    value={formData.phone} onChange={handleChange}
                    placeholder="0901 234 567"
                    className={inputCls}
                  />
                </div>

                <div className="au d3 grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dob" optional>Ngày sinh</Label>
                    <input id="dob" name="dob" type="date"
                      value={formData.dob} onChange={handleChange}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <Label htmlFor="gender">Giới tính</Label>
                    <select id="gender" name="gender"
                      value={formData.gender} onChange={handleChange}
                      className={inputCls}
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                </div>

                {/* ── Account info ── */}
                <div className="au d4 pt-1">
                  <SectionTitle>Tài khoản</SectionTitle>
                </div>

                <div className="au d4">
                  <Label htmlFor="username">Tên đăng nhập</Label>
                  <input id="username" name="username" type="text"
                    value={formData.username} onChange={handleChange}
                    placeholder="nguyenvana" required minLength={4} maxLength={20}
                    className={inputCls}
                  />
                  <p className="mt-1 text-[11px] text-slate-400">4-20 ký tự: chữ, số, dấu gạch dưới</p>
                </div>

                <div className="au d5">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <div className="relative">
                    <input id="password" name="password"
                      type={showPw ? 'text' : 'password'}
                      value={formData.password} onChange={handleChange}
                      placeholder="Tối thiểu 8 ký tự" required minLength={8}
                      className={inputCls}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        {showPw
                          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                          : <><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></>
                        }
                      </svg>
                    </button>
                  </div>
                  {/* strength bar */}
                  {formData.password && (
                    <div className="mt-2 space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full transition-all duration-300"
                              style={{
                                width: strength >= i ? '100%' : '0%',
                                backgroundColor: STRENGTH_COLOR[strength],
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-[11px]" style={{ color: STRENGTH_COLOR[strength] }}>
                        {STRENGTH_LABEL[strength]}
                      </p>
                    </div>
                  )}
                </div>

                <div className="au d6">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <input id="confirmPassword" name="confirmPassword"
                      type={showCpw ? 'text' : 'password'}
                      value={formData.confirmPassword} onChange={handleChange}
                      placeholder="Nhập lại mật khẩu" required
                      className={`${inputCls} ${formData.confirmPassword && formData.confirmPassword !== formData.password ? 'border-rose-300 ring-2 ring-rose-200' : ''}`}
                    />
                    <button type="button" tabIndex={-1} onClick={() => setShowCpw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                        {showCpw
                          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></>
                          : <><path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" /><circle cx="12" cy="12" r="3" /></>
                        }
                      </svg>
                    </button>
                  </div>
                  {formData.confirmPassword && formData.confirmPassword !== formData.password && (
                    <p className="mt-1 text-[11px] text-rose-500">Mật khẩu chưa khớp</p>
                  )}
                </div>

                {/* ── Submit ── */}
                <div className="au d7 pt-1">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-92 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
                        </svg>
                        Đang đăng ký…
                      </span>
                    ) : 'Tạo tài khoản'}
                  </button>
                </div>

              </form>

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-100" />
                <span className="text-[11px] font-medium text-slate-300">HOẶC</span>
                <div className="h-px flex-1 bg-slate-100" />
              </div>

              <p className="text-center text-xs text-slate-500">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-semibold text-sky-600 transition hover:text-sky-500">
                  Đăng nhập ngay
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-[11px] text-slate-400">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <a href="#" className="underline underline-offset-2 hover:text-slate-600">Điều khoản dịch vụ</a>
          </p>
        </div>
      </div>
    </>
  )
}

export default Register