import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

const TEAM = [
    {
        name: 'Nguyễn Phước Nguỡng Long',
        role: 'Full-stack developer',
        avatar: '/avatar/longnpn.jpg',
        bio: 'Sinh viên năm 3, ngành Mạng máy tính & Truyền thông dữ liệu, trường Đại học Công nghệ, ĐHQGHN.',
        accent: 'from-sky-500 to-indigo-500',
        socials: {
            github: 'https://github.com/NPNLong',
            linkedin: 'https://www.linkedin.com/in/nguyen-phuoc-nguong-long-714303335/',
            facebook: 'https://web.facebook.com/LongNpn/?locale=vi_VN',
        },
    },
    {
        name: 'Đinh Minh Vũ',
        role: 'Backend developer',
        avatar: '/avatar/vudm.jpg',
        bio: 'Sinh viên năm 3, ngành Mạng máy tính & Truyền thông dữ liệu, trường Đại học Công nghệ, ĐHQGHN.',
        accent: 'from-emerald-500 to-teal-500',
        socials: {
            github: 'https://github.com/minhvudinh23',
            linkedin: 'https://www.linkedin.com/in/nguyen-phuoc-nguong-long-714303335/',
            facebook: 'https://web.facebook.com/vu.inh.266145?locale=vi_VN',
        },
    },
    {
        name: 'Nguyễn Văn Lập',
        role: 'Frontend developer',
        avatar: '/avatar/lapnv.jpg',
        bio: 'Sinh viên năm 3, ngành Mạng máy tính & Truyền thông dữ liệu, trường Đại học Công nghệ, ĐHQGHN.',
        accent: 'from-violet-500 to-purple-500',
        socials: {
            github: 'https://github.com/nvlhuongnoi2005',
            linkedin: 'https://www.linkedin.com/in/nguyen-phuoc-nguong-long-714303335/',
            facebook: 'https://web.facebook.com/nvlhuongnoi?locale=vi_VN',
        },
    },
]

const CSS = `
@keyframes ctcFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ctcFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes ctcShimmerBg {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes ctcPing {
  0%   { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2.5); opacity: 0; }
}
@keyframes ctcFloat {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-8px); }
}
@keyframes ctcGlow {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
}
@keyframes ctcSpin {
  to { transform: rotate(360deg); }
}

.ctc-hero      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.05s both; }
.ctc-team      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.15s both; }
.ctc-channels  { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.2s both; }
.ctc-form      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.3s both; }
.ctc-side      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.4s both; }
.ctc-faq       { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.5s both; }

.ctc-hero-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: ctcShimmerBg 14s ease infinite;
}

.ctc-pulse-ring  { animation: ctcPing 2s cubic-bezier(0,0,0.2,1) infinite; }
.ctc-float       { animation: ctcFloat 4s ease-in-out infinite; }
.ctc-float-d1    { animation-delay: 0.3s; }
.ctc-float-d2    { animation-delay: 0.6s; }
.ctc-glow        { animation: ctcGlow 3s ease-in-out infinite; }

.ctc-card-3d {
  transition: transform 0.5s cubic-bezier(.22,1,.36,1), box-shadow 0.5s ease;
  transform-style: preserve-3d;
}
.ctc-card-3d:hover {
  transform: translateY(-8px);
}

/* Avatar gradient ring on hover */
.ctc-avatar-ring {
  position: relative;
}
.ctc-avatar-ring::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 9999px;
  background: var(--ring-gradient);
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.ctc-card-3d:hover .ctc-avatar-ring::before {
  opacity: 1;
}

/* Spinning aurora ring around avatar */
.ctc-avatar-aurora::after {
  content: '';
  position: absolute;
  inset: -6px;
  border-radius: 9999px;
  background: conic-gradient(from 0deg, transparent, var(--aurora-color), transparent);
  z-index: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  animation: ctcSpin 3s linear infinite;
}
.ctc-card-3d:hover .ctc-avatar-aurora::after {
  opacity: 0.5;
}

button:not(:disabled), a { cursor: pointer; }
button:disabled { cursor: not-allowed; }
`

const TOPICS = [
    { value: 'support', label: 'Hỗ trợ kỹ thuật' },
    { value: 'billing', label: 'Thanh toán & hoàn tiền' },
    { value: 'event', label: 'Đăng ký tổ chức sự kiện' },
    { value: 'partner', label: 'Hợp tác doanh nghiệp' },
    { value: 'feedback', label: 'Góp ý sản phẩm' },
    { value: 'other', label: 'Khác' },
]

const FAQ = [
    {
        q: 'Vé điện tử có được hoàn tiền không?',
        a: 'Vé đã thanh toán thường không hoàn lại, trừ khi sự kiện bị hủy bởi đơn vị tổ chức. Mỗi sự kiện có chính sách riêng được hiển thị trước khi bạn xác nhận thanh toán.',
    },
    {
        q: 'Tôi nhận vé bằng cách nào?',
        a: 'Sau khi thanh toán thành công, mã QR vé sẽ được gửi tới email đăng ký và lưu trong mục "Vé của tôi" trong tài khoản. Bạn có thể xuất trình mã QR trên điện thoại tại cổng vào.',
    },
    {
        q: 'Tôi có thể chuyển nhượng vé cho người khác không?',
        a: 'Mặc định, vé là không chuyển nhượng để chống chợ đen. Một số sự kiện có thể bật tính năng chuyển nhượng - kiểm tra điều khoản cụ thể của sự kiện.',
    },
    {
        q: 'Thời gian phản hồi của đội hỗ trợ là bao lâu?',
        a: 'Chúng tôi cam kết phản hồi trong 48 giờ làm việc. Với các vấn đề khẩn cấp liên quan đến sự kiện đang diễn ra, hãy liên hệ qua hotline để được hỗ trợ ngay.',
    },
]

// Social SVG icons (brand-accurate)
const SocialIcon = {
    github: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
        </svg>
    ),
    linkedin: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    ),
    facebook: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
    ),
}

function Icon({ name }) {
    const props = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }
    switch (name) {
        case 'mail': return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6 8.5 6.5L20.5 6" /></svg>
        case 'phone': return <svg {...props}><path d="M5 4h3l2 4-2.5 1.5a11 11 0 0 0 6 6L15 13l4 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z" /></svg>
        case 'pin': return <svg {...props}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0Z" /><circle cx="12" cy="10" r="3" /></svg>
        case 'clock': return <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
        case 'send': return <svg {...props}><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4Z" /></svg>
        case 'check': return <svg {...props} strokeWidth="2.5"><path d="m4 12 5 5L20 6" /></svg>
        case 'plus': return <svg {...props} strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>
        case 'sparkle': return <svg {...props}><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>
        case 'cap': return <svg {...props}><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c0 1 3 3 6 3s6-2 6-3v-5" /></svg>
        default: return null
    }
}

// ─── Team Member Card ────────────────────────────────────────────────────────
function TeamCard({ member, index, isDark }) {
    // Map accent color → aurora & ring CSS vars
    const auroraColors = {
        'from-sky-500 to-indigo-500': '#6366f1',
        'from-emerald-500 to-teal-500': '#14b8a6',
        'from-violet-500 to-purple-500': '#a855f7',
    }
    const auroraColor = auroraColors[member.accent] || '#6366f1'

    const socialBtnCls = (platform) => {
        const base = `flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-110 ${isDark ? 'bg-white/5 text-slate-400 ring-1 ring-white/10' : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
            }`
        const hoverMap = {
            github: isDark ? 'hover:bg-slate-700 hover:text-white hover:ring-slate-600 hover:shadow-lg hover:shadow-slate-500/30'
                : 'hover:bg-slate-900 hover:text-white hover:ring-slate-900 hover:shadow-lg hover:shadow-slate-900/20',
            linkedin: 'hover:bg-[#0A66C2] hover:text-white hover:ring-[#0A66C2] hover:shadow-lg hover:shadow-[#0A66C2]/40',
            facebook: 'hover:bg-[#1877F2] hover:text-white hover:ring-[#1877F2] hover:shadow-lg hover:shadow-[#1877F2]/40',
        }
        return `${base} ${hoverMap[platform] || ''}`
    }

    return (
        <div
            className={`ctc-card-3d ctc-team relative rounded-3xl border p-6 shadow-sm ${isDark ? 'border-white/10 bg-slate-900/60 backdrop-blur-sm hover:shadow-xl hover:shadow-slate-950/50' : 'border-slate-200/80 bg-white hover:shadow-2xl hover:shadow-slate-200/60'
                }`}
            style={{
                animationDelay: `${0.2 + index * 0.1}s`,
                '--ring-gradient': `linear-gradient(135deg, ${auroraColor}, ${auroraColor}88)`,
                '--aurora-color': auroraColor,
            }}
        >
            {/* Top accent strip */}
            <div className={`absolute left-0 top-0 h-1 w-full rounded-t-3xl bg-gradient-to-r ${member.accent}`} />

            {/* Decorative blur orb top-right */}
            <div
                className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${member.accent} opacity-10 blur-2xl ctc-glow`}
            />

            {/* Avatar */}
            <div className="relative mx-auto mb-4 flex h-24 w-24 items-center justify-center">
                <div className="ctc-avatar-aurora ctc-avatar-ring relative h-24 w-24">
                    <div className={`relative z-10 h-full w-full overflow-hidden rounded-full ring-4 ${isDark ? 'ring-slate-900' : 'ring-white'
                        } shadow-xl`}>
                        {member.avatar ? (
                            <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${member.accent} text-3xl font-black text-white`}>
                                {member.name.charAt(0)}
                            </div>
                        )}
                    </div>
                </div>

                {/* Online dot */}
                <span className="absolute bottom-1 right-1 z-20 flex h-4 w-4">
                    <span className="ctc-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                    <span className={`relative inline-flex h-4 w-4 rounded-full bg-emerald-500 ring-2 ${isDark ? 'ring-slate-900' : 'ring-white'}`} />
                </span>
            </div>

            {/* Name + role */}
            <div className="text-center">
                <h3 className="text-base font-extrabold tracking-tight" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {member.name}
                </h3>
                <div className="mt-1.5 inline-flex items-center gap-1.5">
                    <span className={`inline-block h-1 w-1 rounded-full bg-gradient-to-r ${member.accent}`} />
                    <span className={`text-[11px] font-semibold uppercase tracking-widest bg-gradient-to-r ${member.accent} bg-clip-text text-transparent`}>
                        {member.role}
                    </span>
                    <span className={`inline-block h-1 w-1 rounded-full bg-gradient-to-r ${member.accent}`} />
                </div>
            </div>

            {/* Bio */}
            <div className={`my-4 border-y py-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                <div className="flex items-start gap-2">
                    <span className={`mt-0.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                        <Icon name="cap" />
                    </span>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {member.bio}
                    </p>
                </div>
            </div>

            {/* Socials */}
            {member.socials && (
                <div className="flex items-center justify-center gap-2.5">
                    {member.socials.github && (
                        <a href={member.socials.github} target="_blank" rel="noopener noreferrer"
                            aria-label={`GitHub của ${member.name}`}
                            className={socialBtnCls('github')}>
                            {SocialIcon.github}
                        </a>
                    )}
                    {member.socials.linkedin && (
                        <a href={member.socials.linkedin} target="_blank" rel="noopener noreferrer"
                            aria-label={`LinkedIn của ${member.name}`}
                            className={socialBtnCls('linkedin')}>
                            {SocialIcon.linkedin}
                        </a>
                    )}
                    {member.socials.facebook && (
                        <a href={member.socials.facebook} target="_blank" rel="noopener noreferrer"
                            aria-label={`Facebook của ${member.name}`}
                            className={socialBtnCls('facebook')}>
                            {SocialIcon.facebook}
                        </a>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Main ────────────────────────────────────────────────────────────────────
function ContactUs() {
    const { isDark } = useTheme()
    const [form, setForm] = useState({ name: '', email: '', topic: 'support', message: '' })
    const [sending, setSending] = useState(false)
    const [sent, setSent] = useState(false)
    const [error, setError] = useState('')
    const [openFaq, setOpenFaq] = useState(0)

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(p => ({ ...p, [name]: value }))
        setError('')
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')

        if (!form.name.trim() || form.name.trim().length < 2) { setError('Vui lòng nhập họ tên (ít nhất 2 ký tự).'); return }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) { setError('Email không hợp lệ.'); return }
        if (!form.message.trim() || form.message.trim().length < 10) { setError('Nội dung phải có ít nhất 10 ký tự.'); return }

        setSending(true)
        try {
            // TODO: thay bằng API thực: await contactApi.send(form)
            await new Promise(r => setTimeout(r, 900))
            setSent(true)
        } catch (err) {
            setError(err.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.')
        } finally {
            setSending(false)
        }
    }

    // Theme tokens
    const bg = isDark ? 'bg-slate-950' : 'bg-[#f6f7fb]'
    const text = isDark ? 'text-slate-100' : 'text-slate-900'
    const muted = isDark ? 'text-slate-400' : 'text-slate-500'
    const subtle = isDark ? 'text-slate-500' : 'text-slate-400'
    const card = isDark ? 'border-white/10 bg-slate-900/60 backdrop-blur-sm' : 'border-slate-200/80 bg-white'
    const inputCls = isDark
        ? 'w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder-slate-500 focus:border-sky-400/60 focus:bg-slate-800 focus:ring-2 focus:ring-sky-400/15'
        : 'w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-sky-400/70 focus:bg-white focus:ring-2 focus:ring-sky-400/15'
    const labelCls = `mb-1.5 block text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`

    const CHANNELS = [
        {
            icon: 'mail', label: 'Email', value: 'support@ticketrush.vn',
            hint: 'Phản hồi trong 48h', href: 'mailto:support@ticketrush.vn',
            color: isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'
        },
        {
            icon: 'phone', label: 'Hotline', value: '1900 1234',
            hint: '8h-22h hàng ngày', href: 'tel:19001234',
            color: isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'
        },
        {
            icon: 'pin', label: 'Văn phòng', value: 'Hà Nội · TP.HCM',
            hint: 'Làm việc giờ hành chính', href: '#offices',
            color: isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
        },
    ]

    return (
        <>
            <style>{CSS}</style>
            <div className={`min-h-screen ${bg} ${text}`}>

                {/* ════════════════ HERO ════════════════ */}
                <div className="ctc-hero-bg relative overflow-hidden">
                    <div
                        className="absolute inset-0 opacity-25"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                            backgroundSize: '36px 36px',
                            maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 75%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at top, black 0%, transparent 75%)',
                        }}
                    />
                    {/* Floating decorative orbs */}
                    <div className="ctc-float pointer-events-none absolute left-[15%] top-[20%] h-32 w-32 rounded-full bg-white/10 blur-3xl" />
                    <div className="ctc-float ctc-float-d1 pointer-events-none absolute right-[10%] top-[30%] h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
                    <div className="ctc-float ctc-float-d2 pointer-events-none absolute left-[60%] bottom-[15%] h-24 w-24 rounded-full bg-pink-300/20 blur-3xl" />

                    <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20 text-center">
                        <Link to="/" className="ctc-hero inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M13 8H3M7 4L3 8l4 4" />
                            </svg>
                            Quay về trang chủ
                        </Link>

                        <h1 className="ctc-hero mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Chúng tôi luôn lắng nghe
                        </h1>
                        <p className="ctc-hero mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                            Có câu hỏi, góp ý, hoặc cần hỗ trợ? Chọn cách phù hợp nhất để liên hệ - chúng tôi sẽ phản hồi sớm nhất có thể.
                        </p>
                    </div>
                    <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b ${isDark ? 'from-transparent to-slate-950' : 'from-transparent to-[#f6f7fb]'}`} />
                </div>

                <section className="mx-auto max-w-6xl px-6 pb-16 md:px-8">

                    {/* ════════════════ VỀ CHÚNG TÔI ════════════════ */}
                    <div className="ctc-team mt-12 mb-14">
                        <div className="mb-8 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/5 px-3.5 py-1 text-xs font-bold text-sky-500">
                                <span className="text-amber-500"><Icon name="sparkle" /></span>
                                Về chúng tôi
                            </div>
                            <h2 className="mt-3 text-3xl font-extrabold tracking-tight md:text-4xl"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Đội ngũ {' '}
                                <span className="bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
                                    TicketRush
                                </span>
                            </h2>
                            <p className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed ${muted}`}>
                                Chúng tôi là các sinh viên năm 3, đồng thời là nhà phát triển của <b>TicketRush</b>: nền tảng bán vé hiện đại, minh bạch và đáng tin cậy, hướng tới việc tối ưu trải nghiệm mua vé cho cả người dùng lẫn nhà tổ chức.
                            </p>
                        </div>

                        <div className="grid gap-5 md:grid-cols-3">
                            {TEAM.map((member, i) => (
                                <TeamCard key={member.name} member={member} index={i} isDark={isDark} />
                            ))}
                        </div>
                    </div>

                    {/* Section divider */}
                    <div className="mb-12 flex items-center gap-4">
                        <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                        <span className={`text-[10px] font-bold uppercase tracking-[0.3em] ${subtle}`}>Liên hệ với chúng tôi</span>
                        <div className={`h-px flex-1 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    </div>

                    {/* ════════════════ Channel cards ════════════════ */}
                    <div className="ctc-channels grid gap-4 md:grid-cols-3">
                        {CHANNELS.map((c) => (
                            <a key={c.label} href={c.href}
                                className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${card}`}>
                                <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                                    <Icon name={c.icon} />
                                </div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>{c.label}</p>
                                <p className="mt-0.5 text-base font-bold transition group-hover:text-sky-500">{c.value}</p>
                                <p className={`mt-1 text-xs ${muted}`}>{c.hint}</p>
                            </a>
                        ))}
                    </div>

                    {/* ════════════════ Form + Sidebar ════════════════ */}
                    <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_320px]">

                        {/* Form */}
                        <div className={`ctc-form overflow-hidden rounded-3xl border shadow-sm ${card}`}>
                            <div className={`flex items-center gap-3 border-b px-6 py-5 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                                    <Icon name="send" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold">Gửi tin nhắn</h2>
                                    <p className={`text-xs ${muted}`}>Điền form bên dưới, chúng tôi sẽ phản hồi qua email.</p>
                                </div>
                            </div>

                            <div className="p-6">
                                {sent ? (
                                    <div className="py-6 text-center">
                                        <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                            <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-400/20" />
                                            <span className="relative text-emerald-500"><Icon name="check" /></span>
                                        </div>
                                        <h3 className="text-lg font-extrabold">Đã nhận tin nhắn của bạn</h3>
                                        <p className={`mt-1.5 text-sm ${muted}`}>
                                            Chúng tôi sẽ phản hồi qua <span className="font-semibold">{form.email}</span> trong vòng 48 giờ làm việc.
                                        </p>
                                        <button onClick={() => { setSent(false); setForm({ name: '', email: '', topic: 'support', message: '' }) }}
                                            className="mt-5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-90">
                                            Gửi tin nhắn khác
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        {error && (
                                            <div className={`flex items-start gap-2.5 rounded-xl border p-3 text-xs ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'
                                                }`}>
                                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" className="mt-0.5 shrink-0">
                                                    <circle cx="8" cy="8" r="6.5" /><path d="M8 5v3.5M8 11h.01" />
                                                </svg>
                                                {error}
                                            </div>
                                        )}

                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className={labelCls}>Họ và tên</label>
                                                <input name="name" value={form.name} onChange={handleChange} placeholder="Nguyễn Văn A" required className={inputCls} />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Email</label>
                                                <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="a@mail.com" required className={inputCls} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Chủ đề</label>
                                            <select name="topic" value={form.topic} onChange={handleChange} className={inputCls}>
                                                {TOPICS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                            </select>
                                        </div>

                                        <div>
                                            <label className={labelCls}>Nội dung</label>
                                            <textarea name="message" value={form.message} onChange={handleChange} rows={6}
                                                placeholder="Mô tả chi tiết vấn đề hoặc nội dung bạn muốn trao đổi..."
                                                required minLength={10}
                                                className={`${inputCls} resize-y`}
                                            />
                                            <p className={`mt-1.5 text-[11px] ${subtle}`}>
                                                {form.message.length} ký tự · tối thiểu 10 ký tự
                                            </p>
                                        </div>

                                        <button type="submit" disabled={sending}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:opacity-60">
                                            {sending ? (
                                                <>
                                                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    Đang gửi…
                                                </>
                                            ) : (
                                                <>
                                                    <Icon name="send" />
                                                    Gửi tin nhắn
                                                </>
                                            )}
                                        </button>

                                        <p className={`text-center text-[11px] ${subtle}`}>
                                            Bằng việc gửi, bạn đồng ý với{' '}
                                            <Link to="/privacy-policy" className="font-medium underline underline-offset-2 hover:text-sky-500">Chính sách bảo mật</Link>
                                            {' '}của chúng tôi.
                                        </p>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* Sidebar */}
                        <aside className="ctc-side space-y-5">
                            {/* Office hours */}
                            <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                                        <Icon name="clock" />
                                    </div>
                                    <h3 className="text-sm font-bold">Giờ làm việc</h3>
                                </div>
                                <ul className={`space-y-1.5 text-sm ${muted}`}>
                                    <li className="flex justify-between">
                                        <span>T2 - T6</span>
                                        <span className="font-semibold">8:00 - 18:00</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>T7</span>
                                        <span className="font-semibold">9:00 - 17:00</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>CN &amp; lễ</span>
                                        <span className="font-semibold">Nghỉ</span>
                                    </li>
                                </ul>
                                <div className={`mt-3 border-t pt-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                    <p className={`text-[11px] leading-relaxed ${subtle}`}>
                                        Hotline hỗ trợ vé: <span className="font-semibold">8h - 22h</span> mọi ngày, kể cả lễ tết.
                                    </p>
                                </div>
                            </div>

                            {/* Offices */}
                            <div id="offices" className={`rounded-2xl border p-5 shadow-sm ${card}`}>
                                <div className="mb-3 flex items-center gap-2">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <Icon name="pin" />
                                    </div>
                                    <h3 className="text-sm font-bold">Văn phòng</h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide">Hà Nội</p>
                                        <p className={`mt-0.5 text-xs leading-relaxed ${muted}`}>
                                            Tầng 8, Tòa nhà Capital, 109 Trần Hưng Đạo, Hoàn Kiếm
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wide">TP. Hồ Chí Minh</p>
                                        <p className={`mt-0.5 text-xs leading-relaxed ${muted}`}>
                                            Tầng 12, Bitexco Financial Tower, 2 Hải Triều, Quận 1
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </div>

                    {/* ════════════════ FAQ ════════════════ */}
                    <div className="ctc-faq mt-14">
                        <div className="mb-6 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Câu hỏi thường gặp</p>
                            <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Có thể bạn quan tâm
                            </h2>
                            <p className={`mt-2 text-sm ${muted}`}>
                                Một số thắc mắc phổ biến đã có câu trả lời sẵn - kiểm tra trước khi gửi tin nhắn.
                            </p>
                        </div>

                        <div className="mx-auto max-w-3xl space-y-3">
                            {FAQ.map((item, i) => (
                                <div key={i} className={`overflow-hidden rounded-2xl border transition ${card} ${openFaq === i ? 'shadow-md' : ''}`}>
                                    <button
                                        type="button"
                                        onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition"
                                    >
                                        <span className="text-sm font-bold">{item.q}</span>
                                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition ${openFaq === i
                                            ? (isDark ? 'rotate-45 bg-sky-500/20 text-sky-400' : 'rotate-45 bg-sky-100 text-sky-600')
                                            : (isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500')
                                            }`}>
                                            <Icon name="plus" />
                                        </span>
                                    </button>
                                    {openFaq === i && (
                                        <div className={`px-5 pb-4 text-sm leading-relaxed ${muted}`}>
                                            {item.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

export default ContactUs