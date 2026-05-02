import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// ─── Validation ────────────────────────────────────────────────────────────────
function validateRegistration(f) {
    if (!f.full_name.trim() || f.full_name.trim().length < 2) return 'Họ và tên phải có ít nhất 2 ký tự.'
    if (!f.email.trim() || !/^\S+@\S+\.\S+$/.test(f.email)) return 'Email không hợp lệ.'
    if (f.phone && !/^\d{9,11}$/.test(f.phone.trim())) return 'Số điện thoại phải có 9-11 chữ số.'
    if (!f.username.trim() || !/^[a-zA-Z0-9_]{4,20}$/.test(f.username)) return 'Tên đăng nhập 4-20 ký tự (chữ, số, _).'
    if (!f.password || f.password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự.'
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(f.password)) return 'Mật khẩu cần chữ hoa, thường, số và ký tự đặc biệt.'
    if (f.password !== f.confirmPassword) return 'Mật khẩu xác nhận không khớp.'
    return ''
}

function pwStrength(pw) {
    if (!pw) return 0
    let s = 0
    if (pw.length >= 8) s++
    if (/[A-Z]/.test(pw)) s++
    if (/[0-9]/.test(pw)) s++
    if (/[^A-Za-z0-9]/.test(pw)) s++
    return s
}
const STR_LABEL = ['', 'Yếu', 'Trung bình', 'Khá', 'Mạnh']
const STR_COLOR = ['', '#f43f5e', '#f59e0b', '#38bdf8', '#10b981']

// ─── Eye toggle SVG ────────────────────────────────────────────────────────────
function EyeIcon({ show }) {
    return show ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

// ─── Input component ───────────────────────────────────────────────────────────
function Input({ label, optional, hint, right, error, ...props }) {
    return (
        <div>
            <div className="mb-1 flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                    {optional && <span className="ml-1.5 rounded bg-slate-100 px-1 py-0.5 text-[9px] normal-case tracking-normal text-slate-400">tuỳ chọn</span>}
                </label>
                {hint}
            </div>
            <div className="relative">
                <input
                    {...props}
                    className={`w-full rounded-lg border bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder-slate-300 transition focus:bg-white focus:ring-2 ${error ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/50' : 'border-slate-200 focus:border-sky-400/70 focus:ring-sky-400/15'
                        }`}
                />
                {right}
            </div>
            {error && <p className="mt-1 text-[11px] text-rose-500">{error}</p>}
        </div>
    )
}

function Ticker({ top = false }) {
    return (
        <div className={`absolute left-0 right-0 z-20 overflow-hidden bg-slate-900/80 py-3.5 border-y border-slate-800 backdrop-blur-md ${top ? 'top-0' : 'bottom-0'}`}>
            <div className="ticker-track flex w-max gap-8">
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
                    <span
                        key={i}
                        className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                    >
                        <span className="h-1 w-1 rounded-full bg-sky-500" />
                        {t}
                    </span>
                ))}
            </div>
        </div>
    )
}

// ─── Auth Dialog ───────────────────────────────────────────────────────────────
const CONCERT_IMG = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&q=80'
const FESTIVAL_IMG = 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80'

function AuthDialog({ mode, onClose, onSwitch, onSuccess, onForgotPassword }) {
    const { login, register } = useAuth()
    const isLogin = mode === 'login'
    const imgSrc = isLogin ? CONCERT_IMG : FESTIVAL_IMG

    // Login state
    const [loginData, setLoginData] = useState({ username: '', password: '' })
    const [showLPw, setShowLPw] = useState(false)

    // Register state
    const [regData, setRegData] = useState({
        full_name: '', email: '', phone: '', dob: '', gender: 'male',
        username: '', password: '', confirmPassword: '',
    })
    const [showRPw, setShowRPw] = useState(false)
    const [showRCpw, setShowRCpw] = useState(false)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setError(''); setLoading(true)
        try {
            await login(loginData)
            onSuccess?.()
        } catch (err) {
            setError(err.message || 'Tên đăng nhập hoặc mật khẩu không đúng.')
            setLoading(false)
        }
    }

    const handleRegSubmit = async (e) => {
        e.preventDefault()
        setError('')
        const ve = validateRegistration(regData)
        if (ve) { setError(ve); return }
        setLoading(true)
        try {
            let dob = regData.dob
            if (dob && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
                const [y, m, d] = dob.split('-'); dob = `${d}/${m}/${y}`
            }
            await register({ ...regData, dob })
            setLoading(false)
            alert('Đăng ký thành công! Vui lòng đăng nhập.')
            onSwitch()
        } catch (err) {
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.')
            setLoading(false)
        }
    }

    const strength = pwStrength(regData.password)

    // Trap scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    return (
        <div
            className="display-font fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(10,14,26,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative flex w-full overflow-hidden rounded-2xl shadow-2xl"
                style={{ maxWidth: isLogin ? 800 : 1050, maxHeight: '92vh', background: '#fff' }}
            >
                {/* ── Left: image panel (30%) ── */}
                <div className="relative hidden w-[40%] shrink-0 md:block">
                    <img src={imgSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(14,165,233,0.55) 0%, rgba(79,70,229,0.7) 100%)' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-between px-6 py-8 text-white">
                        {/* logo */}
                        <div className="text-center">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                                    <path d="M2 9a1 1 0 0 1 0-2V6h20v1a1 1 0 0 1 0 2v1a1 1 0 0 1 0 2v1H2v-1a1 1 0 0 1 0-2V9Z" />
                                    <line x1="9" y1="6" x2="9" y2="18" strokeDasharray="2 2" />
                                </svg>
                            </div>
                            <p className="mt-2 text-sm font-bold tracking-widest opacity-90">TICKETRUSH</p>
                        </div>
                        {/* tagline */}
                        <div className="text-center">
                            <p className="text-xl font-extrabold leading-tight">
                                {isLogin ? 'Chào mừng\ntrở lại!' : 'Sân khấu\nchờ bạn.'}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed opacity-70">
                                {isLogin
                                    ? 'Đăng nhập để xem sự kiện yêu thích và đặt vé ngay.'
                                    : 'Tạo tài khoản miễn phí và khám phá hàng nghìn sự kiện.'}
                            </p>
                        </div>
                        {/* switch mode */}
                        <div className="text-center">
                            <p className="text-xs opacity-60">{isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}</p>
                            <button onClick={onSwitch} className="mt-1 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25">
                                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right: form (70%) ── */}
                <div className="flex flex-1 flex-col overflow-y-auto">
                    {/* header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                                {isLogin ? 'Đăng nhập' : 'Tạo tài khoản'}
                            </h2>
                        </div>
                        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M3 3l10 10M13 3L3 13" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 px-7 py-6">
                        {/* error */}
                        {error && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#f43f5e" strokeWidth="1.8">
                                    <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" strokeLinecap="round" />
                                </svg>
                                <p className="text-xs text-rose-600">{error}</p>
                            </div>
                        )}

                        {/* ── LOGIN FORM ── */}
                        {isLogin && (
                            <form onSubmit={handleLoginSubmit} className="space-y-4">
                                <Input
                                    label="Tên đăng nhập" id="l-username" type="text"
                                    value={loginData.username} onChange={e => setLoginData(p => ({ ...p, username: e.target.value }))}
                                    placeholder="nguyenvana" required
                                />
                                <Input
                                    label="Mật khẩu" id="l-password" type={showLPw ? 'text' : 'password'}
                                    value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                                    placeholder="••••••••" required
                                    hint={
                                        <button
                                            type="button"
                                            onClick={onForgotPassword}
                                            className="text-[11px] font-medium text-sky-500 transition hover:text-sky-400"
                                        >
                                            Quên mật khẩu?
                                        </button>
                                    }
                                    right={
                                        <button type="button" tabIndex={-1} onClick={() => setShowLPw(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <EyeIcon show={showLPw} />
                                        </button>
                                    }
                                />
                                <button type="submit" disabled={loading}
                                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                                    {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
                                </button>
                                <p className="text-center text-xs text-slate-400 md:hidden">
                                    Chưa có tài khoản? <button type="button" onClick={onSwitch} className="font-semibold text-sky-600">Đăng ký</button>
                                </p>
                            </form>
                        )}

                        {/* ── REGISTER FORM ── */}
                        {!isLogin && (
                            <form onSubmit={handleRegSubmit} className="space-y-3.5">
                                {/* section: personal */}
                                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Thông tin cá nhân</p>

                                <Input label="Họ và tên" id="r-name" type="text"
                                    value={regData.full_name} onChange={e => { setRegData(p => ({ ...p, full_name: e.target.value })); setError('') }}
                                    placeholder="Nguyễn Văn A" required minLength={2}
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Email" id="r-email" type="email"
                                        value={regData.email} onChange={e => { setRegData(p => ({ ...p, email: e.target.value })); setError('') }}
                                        placeholder="a@mail.com" required
                                    />
                                    <Input label="Điện thoại" id="r-phone" type="tel" optional
                                        value={regData.phone} onChange={e => { setRegData(p => ({ ...p, phone: e.target.value })); setError('') }}
                                        placeholder="0901 234 567"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <Input label="Ngày sinh" id="r-dob" type="date" optional
                                        value={regData.dob} onChange={e => { setRegData(p => ({ ...p, dob: e.target.value })); setError('') }}
                                    />
                                    <div>
                                        <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-400">Giới tính</label>
                                        <select id="r-gender" value={regData.gender}
                                            onChange={e => setRegData(p => ({ ...p, gender: e.target.value }))}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-400/70 focus:bg-white focus:ring-2 focus:ring-sky-400/15">
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="other">Khác</option>
                                        </select>
                                    </div>
                                </div>

                                {/* section: account */}
                                <p className="pt-1 text-[10px] font-bold uppercase tracking-widest text-slate-300">Tài khoản</p>

                                <Input label="Tên đăng nhập" id="r-username" type="text"
                                    value={regData.username} onChange={e => { setRegData(p => ({ ...p, username: e.target.value })); setError('') }}
                                    placeholder="nguyenvana" required minLength={4} maxLength={20}
                                />

                                <div>
                                    <div className="mb-1">
                                        <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Mật khẩu</label>
                                    </div>
                                    <div className="relative">
                                        <input id="r-password" type={showRPw ? 'text' : 'password'}
                                            value={regData.password}
                                            onChange={e => { setRegData(p => ({ ...p, password: e.target.value })); setError('') }}
                                            placeholder="Tối thiểu 8 ký tự" required minLength={8}
                                            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder-slate-300 transition focus:border-sky-400/70 focus:bg-white focus:ring-2 focus:ring-sky-400/15"
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowRPw(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <EyeIcon show={showRPw} />
                                        </button>
                                    </div>
                                    {regData.password && (
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <div className="flex flex-1 gap-1">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                                                        <div className="h-full rounded-full transition-all duration-300"
                                                            style={{ width: strength >= i ? '100%' : '0', backgroundColor: STR_COLOR[strength] }} />
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-medium" style={{ color: STR_COLOR[strength] }}>{STR_LABEL[strength]}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-slate-400">Xác nhận mật khẩu</label>
                                    <div className="relative">
                                        <input id="r-cpw" type={showRCpw ? 'text' : 'password'}
                                            value={regData.confirmPassword}
                                            onChange={e => { setRegData(p => ({ ...p, confirmPassword: e.target.value })); setError('') }}
                                            placeholder="Nhập lại mật khẩu" required
                                            className={`w-full rounded-lg border bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none placeholder-slate-300 transition focus:bg-white focus:ring-2 ${regData.confirmPassword && regData.confirmPassword !== regData.password
                                                ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-200/50'
                                                : 'border-slate-200 focus:border-sky-400/70 focus:ring-sky-400/15'
                                                }`}
                                        />
                                        <button type="button" tabIndex={-1} onClick={() => setShowRCpw(v => !v)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                            <EyeIcon show={showRCpw} />
                                        </button>
                                    </div>
                                    {regData.confirmPassword && regData.confirmPassword !== regData.password && (
                                        <p className="mt-1 text-[11px] text-rose-500">Mật khẩu chưa khớp</p>
                                    )}
                                </div>

                                <button type="submit" disabled={loading}
                                    className="mt-1 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                                    {loading ? 'Đang tạo tài khoản…' : 'Tạo tài khoản'}
                                </button>
                                <p className="text-center text-xs text-slate-400 md:hidden">
                                    Đã có tài khoản? <button type="button" onClick={onSwitch} className="font-semibold text-sky-600">Đăng nhập</button>
                                </p>
                            </form>
                        )}
                    </div>

                    <div className="border-t border-slate-50 px-7 py-4 text-center text-[11px] text-slate-300">
                        Tiếp tục đồng nghĩa với việc bạn chấp nhận{' '}
                        <a href="#" className="underline underline-offset-2 hover:text-slate-500">Điều khoản dịch vụ</a>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Forgot Password Dialog ────────────────────────────────────────────────────
const FORGOT_IMG = 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=600&q=80'

function ForgotPasswordDialog({ onClose, onBackToLogin }) {
    const [step, setStep] = useState(1) // 1 = request link, 2 = success
    const [identifier, setIdentifier] = useState('') // email hoặc username
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [sentTo, setSentTo] = useState('')

    // Trap scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = '' }
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        const v = identifier.trim()
        if (!v) {
            setError('Vui lòng nhập email hoặc tên đăng nhập.')
            return
        }
        // nếu có @ thì validate email
        if (v.includes('@') && !/^\S+@\S+\.\S+$/.test(v)) {
            setError('Email không hợp lệ.')
            return
        }

        setLoading(true)
        try {
            // TODO: thay bằng API thực: await authApi.forgotPassword({ identifier: v })
            await new Promise(r => setTimeout(r, 800))
            setSentTo(v)
            setStep(2)
        } catch (err) {
            setError(err.message || 'Không thể gửi yêu cầu. Vui lòng thử lại.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="display-font fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(10,14,26,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative flex w-full overflow-hidden rounded-2xl shadow-2xl"
                style={{ maxWidth: 800, maxHeight: '92vh', background: '#fff' }}
            >
                {/* ── Left: image panel ── */}
                <div className="relative hidden w-[40%] shrink-0 md:block">
                    <img src={FORGOT_IMG} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, rgba(14,165,233,0.55) 0%, rgba(79,70,229,0.7) 100%)' }} />
                    <div className="absolute inset-0 flex flex-col items-center justify-between px-6 py-8 text-white">
                        <div className="text-center">
                            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round">
                                    <rect x="4" y="11" width="16" height="9" rx="2" />
                                    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                                </svg>
                            </div>
                            <p className="mt-2 text-sm font-bold tracking-widest opacity-90">TICKETRUSH</p>
                        </div>

                        <div className="text-center">
                            <p className="text-xl font-extrabold leading-tight">
                                {step === 1 ? 'Quên mật khẩu?\nĐừng lo.' : 'Đã gửi!\nKiểm tra email.'}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed opacity-70">
                                {step === 1
                                    ? 'Chúng tôi sẽ gửi link đặt lại mật khẩu qua email của bạn.'
                                    : 'Link đặt lại sẽ hết hạn sau 30 phút. Hãy kiểm tra cả thư mục spam.'}
                            </p>
                        </div>

                        <div className="text-center">
                            <p className="text-xs opacity-60">Nhớ ra mật khẩu?</p>
                            <button onClick={onBackToLogin} className="mt-1 rounded-full border border-white/40 bg-white/15 px-4 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-white/25">
                                Đăng nhập
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Right: form ── */}
                <div className="flex flex-1 flex-col overflow-y-auto">
                    {/* header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
                        <div>
                            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
                                {step === 1 ? 'Đặt lại mật khẩu' : 'Email đã được gửi'}
                            </h2>
                            <p className="mt-0.5 text-xs text-slate-400">
                                {step === 1 ? 'Nhập email hoặc tên đăng nhập để tiếp tục' : 'Vui lòng kiểm tra hộp thư'}
                            </p>
                        </div>
                        <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                                <path d="M3 3l10 10M13 3L3 13" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 px-7 py-6">
                        {/* error */}
                        {error && (
                            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5">
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#f43f5e" strokeWidth="1.8">
                                    <circle cx="8" cy="8" r="6" /><path d="M8 5v3M8 11h.01" strokeLinecap="round" />
                                </svg>
                                <p className="text-xs text-rose-600">{error}</p>
                            </div>
                        )}

                        {/* ── STEP 1: request form ── */}
                        {step === 1 && (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* info card */}
                                <div className="flex items-start gap-3 rounded-lg border border-sky-100 bg-sky-50/50 px-3.5 py-3">
                                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" stroke="#0ea5e9" strokeWidth="1.6">
                                        <circle cx="8" cy="8" r="6" />
                                        <path d="M8 5v3.5M8 11h.01" strokeLinecap="round" />
                                    </svg>
                                    <p className="text-xs leading-relaxed text-slate-600">
                                        Chúng tôi sẽ gửi link đặt lại mật khẩu đến email đã đăng ký với tài khoản này.
                                    </p>
                                </div>

                                <Input
                                    label="Email hoặc tên đăng nhập"
                                    id="fp-identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={e => { setIdentifier(e.target.value); setError('') }}
                                    placeholder="a@mail.com hoặc nguyenvana"
                                    required
                                    autoFocus
                                />

                                <button type="submit" disabled={loading}
                                    className="mt-2 w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50">
                                    {loading ? 'Đang gửi…' : 'Gửi link đặt lại'}
                                </button>

                                <button type="button" onClick={onBackToLogin}
                                    className="flex w-full items-center justify-center gap-1.5 py-1 text-xs font-medium text-slate-500 transition hover:text-slate-700">
                                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                        <path d="M13 8H3M7 4L3 8l4 4" />
                                    </svg>
                                    Quay lại đăng nhập
                                </button>
                            </form>
                        )}

                        {/* ── STEP 2: success ── */}
                        {step === 2 && (
                            <div className="space-y-5">
                                {/* success icon */}
                                <div className="flex justify-center">
                                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                        <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/20" />
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 12.5l5 5L20 6.5" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <p className="text-sm text-slate-600">
                                        Chúng tôi đã gửi link đặt lại mật khẩu đến
                                    </p>
                                    <p className="mt-1 break-all text-sm font-bold text-slate-900">{sentTo}</p>
                                </div>

                                {/* checklist */}
                                <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
                                    <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-slate-400">Tiếp theo</p>
                                    <ul className="space-y-1.5 text-xs text-slate-600">
                                        <li className="flex items-start gap-2">
                                            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-600">1</span>
                                            Mở email và bấm vào link đặt lại
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-600">2</span>
                                            Tạo mật khẩu mới (link hết hạn sau 30 phút)
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[9px] font-bold text-sky-600">3</span>
                                            Đăng nhập với mật khẩu mới
                                        </li>
                                    </ul>
                                </div>

                                <button onClick={onBackToLogin}
                                    className="w-full rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-90 active:scale-[0.98]">
                                    Quay lại đăng nhập
                                </button>

                                <button type="button" onClick={() => { setStep(1); setError('') }}
                                    className="w-full text-center text-xs font-medium text-slate-500 transition hover:text-slate-700">
                                    Không nhận được email? Gửi lại
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-slate-50 px-7 py-4 text-center text-[11px] text-slate-300">
                        Cần hỗ trợ?{' '}
                        <a href="mailto:support@ticketrush.vn" className="font-medium underline underline-offset-2 hover:text-slate-500">
                            support@ticketrush.vn
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ─── Keyframes ─────────────────────────────────────────────────────────────────
const CSS = `

* { box-sizing: border-box; }

button:not(:disabled) { cursor: pointer; }
button:disabled { cursor: not-allowed; }

a { cursor: pointer; }

:root {
  --ink: #0a0e1a;
  --sky: #0ea5e9;
  --indigo: #6366f1;
  --muted: #64748b;
}

.page-font { font-family: 'DM Sans', sans-serif; }
.display-font {
  font-family: 'Plus Jakarta Sans', sans-serif;
}

@keyframes heroIn {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes floatA {
  0%,100% { transform: translateY(0px) rotate(-2deg); }
  50%      { transform: translateY(-14px) rotate(-2deg); }
}
@keyframes floatB {
  0%,100% { transform: translateY(0px) rotate(3deg); }
  50%      { transform: translateY(-10px) rotate(3deg); }
}
@keyframes floatC {
  0%,100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
@keyframes scaleIn {
  from { opacity:0; transform: scale(0.94) translateY(20px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}
@keyframes shimmer {
  0%   { background-position: -200% center; }
  100% { background-position:  200% center; }
}

.hero-h1    { animation: heroIn 0.9s cubic-bezier(.22,1,.36,1) 0.1s both; }
.hero-sub   { animation: heroIn 0.9s cubic-bezier(.22,1,.36,1) 0.25s both; }
.hero-cta   { animation: heroIn 0.9s cubic-bezier(.22,1,.36,1) 0.4s both; }
.hero-trust { animation: fadeIn 1s ease 0.7s both; }

.float-a { animation: floatA 5s ease-in-out infinite; }
.float-b { animation: floatB 6.5s ease-in-out infinite 0.8s; }
.float-c { animation: floatC 4.5s ease-in-out infinite 1.5s; }

.ticker-track {
  animation: ticker 28s linear infinite;
  will-change: transform;
}

.card-in { animation: scaleIn 0.55s cubic-bezier(.22,1,.36,1) both; }

.gradient-text {
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 60%, #a855f7 100%);
  background-size: 200%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shimmer 4s linear infinite;
}
`

// ─── Images ────────────────────────────────────────────────────────────────────
const HERO_BG = 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1400&q=80'
const IMG_FEST = 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=600&q=80'
const IMG_CONF = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80'
const IMG_SPORT = 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&q=80'
const IMG_ART = 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80'
const IMG_NIGHT = 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&q=80'
const IMG_CROWD = 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&q=80'
const QR_IMG = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TicketRush'

const FEATURES = [
    { icon: '🎯', title: 'Đặt vé chính xác', desc: 'Sơ đồ ghế ngồi trực quan theo thời gian thực - biết chính xác chỗ ngồi trước khi thanh toán.' },
    { icon: '⚡', title: 'Tức thì, không chờ đợi', desc: 'Hàng chờ ảo thông minh đảm bảo công bằng cho mọi người dùng khi sự kiện hot mở bán.' },
    { icon: '🔒', title: 'Bảo mật tuyệt đối', desc: 'Vé QR mã hóa chống làm giả, xác thực tại cổng chỉ trong vài giây.' },
    { icon: '📱', title: 'Vé điện tử tiện lợi', desc: 'Nhận vé ngay trên điện thoại, không in giấy, không lo mất vé.' },
]

const STATS = [
    { value: '500+', label: 'Sự kiện' },
    { value: '120K+', label: 'Vé đã bán' },
    { value: '50K+', label: 'Người dùng' },
    { value: '4.9★', label: 'Đánh giá' },
]

const TICKER_ITEMS = [
    'Concerts', 'Festivals', 'Sports', 'Theatre', 'Exhibitions', 'Conferences',
    'Workshops', 'Comedy Shows', 'Music Events', 'Art Exhibitions',
]

// ─── Landing Page ──────────────────────────────────────────────────────────────
export default function LandingHome() {
    const [authMode, setAuthMode] = useState(null) // 'login' | 'register' | 'forgot' | null
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        if (user) navigate('/home')
    }, [user, navigate])

    const openLogin = () => setAuthMode('login')
    const openRegister = () => setAuthMode('register')
    const openForgot = () => setAuthMode('forgot')
    const closeAuth = () => setAuthMode(null)
    const switchMode = () => setAuthMode(m => m === 'login' ? 'register' : 'login')
    const backToLogin = () => setAuthMode('login')
    const onSuccess = () => {
        closeAuth()
        navigate('/home')
    }

    return (
        <>
            <style>{CSS}</style>
            <div className="page-font min-h-screen overflow-x-hidden" style={{ color: 'var(--ink)', background: '#f8fafc' }}>

                {/* ══ HERO ══ */}
                <section className="relative flex min-h-screen items-center overflow-hidden">
                    <Ticker top />
                    <Ticker />

                    {/* bg image */}
                    <div className="absolute inset-0">
                        <img src={HERO_BG} alt="" className="h-full w-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(120deg, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.65) 55%, rgba(10,14,26,0.4) 100%)' }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-transparent to-transparent" />
                    </div>

                    <div className="relative z-10 mx-auto max-w-7xl px-6 pt-24 pb-16 md:px-10">
                        <div className="grid items-center gap-16 lg:grid-cols-[1fr_440px]">

                            {/* left text */}
                            <div>
                                <div className="hero-h1 mb-4 inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-400 backdrop-blur-sm">
                                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
                                    Nền tảng đặt vé #1 Việt Nam
                                </div>

                                <h1 className="hero-h1 display-font text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
                                    <span className="gradient-text">TicketRush</span>
                                </h1>

                                <p className="hero-sub mt-6 max-w-lg text-base leading-relaxed text-white/60">
                                    TicketRush mang toàn bộ concerts, festivals, thể thao và nghệ thuật vào một nền tảng - chọn ghế trực quan, thanh toán nhanh, nhận vé QR tức thì.
                                </p>

                                <div className="hero-cta mt-8 flex flex-wrap items-center gap-4">
                                    <button
                                        onClick={openRegister}
                                        className="group relative flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-7 py-3.5 text-sm font-bold text-white shadow-xl shadow-sky-500/30 transition hover:-translate-y-0.5 hover:shadow-2xl"
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            Bắt đầu
                                        </span>
                                        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-transform duration-300 group-hover:translate-x-0" />
                                    </button>

                                    <button
                                        onClick={openLogin}
                                        className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/8 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/15"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            className="transition-transform group-hover:-translate-x-0.5"
                                        >
                                            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                            <path d="M10 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                            <path d="M15 12H3" strokeLinecap="round" />
                                        </svg>
                                        Đã có tài khoản
                                    </button>
                                </div>

                                {/* trust row */}
                                <div className="hero-trust mt-10 flex flex-wrap items-center gap-6">
                                    {STATS.map(s => (
                                        <div key={s.label}>
                                            <p className="display-font text-xl font-extrabold text-white">{s.value}</p>
                                            <p className="text-xs text-white/45">{s.label}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* right: floating cards */}
                            <div className="relative hidden lg:block" style={{ height: 480 }}>
                                {/* card 1 */}
                                <div className="float-a absolute left-0 top-8 w-52 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
                                    <img src={IMG_FEST} alt="" className="h-32 w-full object-cover" />
                                    <div className="bg-white/95 px-3 py-2.5 backdrop-blur-sm">
                                        <p className="text-xs font-bold text-slate-800">Monsoon Festival</p>
                                        <p className="text-[10px] text-slate-400">14 Thg 6 · Hoàng Thành</p>
                                        <div className="mt-1.5 flex items-center justify-between">
                                            <span className="text-xs font-bold text-sky-600">350.000 ₫</span>
                                            <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-600">LIVE</span>
                                        </div>
                                    </div>
                                </div>

                                {/* card 2 */}
                                <div className="float-b absolute right-0 top-0 w-52 overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/50">
                                    <img src={IMG_NIGHT} alt="" className="h-32 w-full object-cover" />
                                    <div className="bg-white/95 px-3 py-2.5 backdrop-blur-sm">
                                        <p className="text-xs font-bold text-slate-800">Đêm nhạc Trịnh</p>
                                        <p className="text-[10px] text-slate-400">22 Thg 7 · Nhà hát Lớn</p>
                                        <div className="mt-1.5 flex items-center justify-between">
                                            <span className="text-xs font-bold text-sky-600">500.000 ₫</span>
                                            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold text-rose-600">HOT</span>
                                        </div>
                                    </div>
                                </div>

                                {/* card 3 - QR */}
                                <div className="float-c absolute bottom-8 left-1/2 -translate-x-1/2 w-44 rounded-2xl border border-white/10 bg-white/95 p-4 shadow-2xl shadow-black/50 text-center backdrop-blur-sm">
                                    <img
                                        src={QR_IMG}
                                        alt="QR Ticket"
                                        className="mx-auto mb-2 h-20 w-20 rounded-lg border border-slate-100 object-cover"
                                    />

                                    <p className="text-[10px] font-bold text-slate-700">Vé điện tử</p>
                                    <p className="text-[9px] text-slate-400">Quét để vào cổng</p>

                                    <div className="mt-2 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-600">
                                        Verified
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </section>

                {/* ══ PHOTO GRID ══ */}
                <section className="mx-auto max-w-7xl px-6 py-20 md:px-10">
                    <div className="mb-12 text-center">
                        <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Khám phá</p>
                        <h2 className="display-font mt-2 text-4xl font-extrabold text-slate-900 md:text-5xl">
                            Sự kiện dành cho mọi người
                        </h2>
                        <p className="mt-3 text-slate-500">Từ concerts hoành tráng đến triển lãm nghệ thuật tinh tế.</p>
                    </div>

                    {/* Masonry-style grid */}
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        <div className="col-span-2 row-span-2 overflow-hidden rounded-2xl">
                            <img src={IMG_FEST} alt="Festival" className="h-full w-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                        <div className="overflow-hidden rounded-2xl">
                            <img src={IMG_CONF} alt="Conference" className="h-48 w-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                        <div className="overflow-hidden rounded-2xl">
                            <img src={IMG_SPORT} alt="Sport" className="h-48 w-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                        <div className="overflow-hidden rounded-2xl">
                            <img src={IMG_ART} alt="Art" className="h-48 w-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                        <div className="overflow-hidden rounded-2xl">
                            <img src={IMG_CROWD} alt="Crowd" className="h-48 w-full object-cover transition-transform duration-700 hover:scale-105" />
                        </div>
                    </div>
                </section>

                {/* ══ FEATURES ══ */}
                <section className="bg-slate-900 py-20">
                    <div className="mx-auto max-w-7xl px-6 md:px-10">
                        <div className="mb-12 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-sky-400">Tại sao TicketRush?</p>
                            <h2 className="display-font mt-2 text-4xl font-extrabold text-white md:text-5xl">
                                Trải nghiệm đặt vé{' '}
                                <span className="gradient-text">khác biệt</span>
                            </h2>
                        </div>
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {FEATURES.map((f, i) => (
                                <div key={i}
                                    className="group rounded-2xl border border-slate-800 bg-slate-800/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:bg-slate-800">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-700 text-2xl transition-transform duration-300 group-hover:scale-110">
                                        {f.icon}
                                    </div>
                                    <h3 className="mb-2 text-sm font-bold text-white">{f.title}</h3>
                                    <p className="text-xs leading-relaxed text-slate-400">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══ CTA BANNER ══ */}
                <section className="relative overflow-hidden py-24">
                    <img src={IMG_NIGHT} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
                    <div className="absolute inset-0 bg-gradient-to-br from-sky-600/40 to-indigo-600/40" />
                    <div className="relative mx-auto max-w-3xl px-6 text-center">
                        <h2 className="display-font text-4xl font-extrabold text-slate-900 md:text-4xl">
                            Sẵn sàng xem sự kiện tiếp theo?
                        </h2>
                        <p className="mt-4 text-slate-600">Tạo tài khoản miễn phí và bắt đầu khám phá ngay hôm nay.</p>
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                            <button onClick={openRegister}
                                className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-sky-500/25 transition hover:-translate-y-0.5 hover:opacity-90">
                                Tạo tài khoản ngay
                            </button>
                            <button onClick={openLogin}
                                className="rounded-full border border-slate-300 bg-white px-8 py-3.5 text-sm font-semibold text-slate-700 shadow transition hover:-translate-y-0.5 hover:bg-slate-50">
                                Đăng nhập
                            </button>
                        </div>
                    </div>
                </section>

                {/* ══ AUTH DIALOGS ══ */}
                {(authMode === 'login' || authMode === 'register') && (
                    <AuthDialog
                        mode={authMode}
                        onClose={closeAuth}
                        onSwitch={switchMode}
                        onSuccess={onSuccess}
                        onForgotPassword={openForgot}
                    />
                )}
                {authMode === 'forgot' && (
                    <ForgotPasswordDialog
                        onClose={closeAuth}
                        onBackToLogin={backToLogin}
                    />
                )}
            </div>
        </>
    )
}