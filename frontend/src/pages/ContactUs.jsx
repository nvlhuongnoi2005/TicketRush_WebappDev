import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

const CSS = `
@keyframes ctcFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes ctcShimmerBg {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes ctcPing {
  0%   { transform: scale(1); opacity: 0.4; }
  100% { transform: scale(2.5); opacity: 0; }
}

.ctc-hero      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.05s both; }
.ctc-channels  { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.2s both; }
.ctc-form      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.3s both; }
.ctc-side      { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.4s both; }
.ctc-faq       { animation: ctcFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.5s both; }

.ctc-hero-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: ctcShimmerBg 14s ease infinite;
}

.ctc-pulse-ring {
  animation: ctcPing 2s cubic-bezier(0,0,0.2,1) infinite;
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
        a: 'Mặc định, vé là không chuyển nhượng để chống chợ đen. Một số sự kiện có thể bật tính năng chuyển nhượng — kiểm tra điều khoản cụ thể của sự kiện.',
    },
    {
        q: 'Thời gian phản hồi của đội hỗ trợ là bao lâu?',
        a: 'Chúng tôi cam kết phản hồi trong 48 giờ làm việc. Với các vấn đề khẩn cấp liên quan đến sự kiện đang diễn ra, hãy liên hệ qua hotline để được hỗ trợ ngay.',
    },
]

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
        default: return null
    }
}

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
            hint: '8h–22h hàng ngày', href: 'tel:19001234',
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

                {/* ── Hero ── */}
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
                    <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20 text-center">
                        <Link to="/" className="ctc-hero inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M13 8H3M7 4L3 8l4 4" />
                            </svg>
                            Quay về trang chủ
                        </Link>

                        <div className="ctc-hero mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="ctc-pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400" />
                                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                            </span>
                            Đội ngũ đang trực tuyến
                        </div>

                        <h1 className="ctc-hero mx-auto mt-4 max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl"
                            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                            Chúng tôi luôn lắng nghe
                        </h1>
                        <p className="ctc-hero mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                            Có câu hỏi, góp ý, hoặc cần hỗ trợ? Chọn cách phù hợp nhất để liên hệ — chúng tôi sẽ phản hồi sớm nhất có thể.
                        </p>
                    </div>
                    <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b ${isDark ? 'from-transparent to-slate-950' : 'from-transparent to-[#f6f7fb]'}`} />
                </div>

                <section className="mx-auto max-w-6xl px-6 pb-16 md:px-8">

                    {/* ── Channel cards ── */}
                    <div className="ctc-channels -mt-12 relative grid gap-4 md:grid-cols-3">
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

                    {/* ── Form + Sidebar ── */}
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
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
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
                                        <span>T2 – T6</span>
                                        <span className="font-semibold">8:00 – 18:00</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>T7</span>
                                        <span className="font-semibold">9:00 – 17:00</span>
                                    </li>
                                    <li className="flex justify-between">
                                        <span>CN &amp; lễ</span>
                                        <span className="font-semibold">Nghỉ</span>
                                    </li>
                                </ul>
                                <div className={`mt-3 border-t pt-3 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                                    <p className={`text-[11px] leading-relaxed ${subtle}`}>
                                        Hotline hỗ trợ vé: <span className="font-semibold">8h – 22h</span> mọi ngày, kể cả lễ tết.
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

                    {/* ── FAQ ── */}
                    <div className="ctc-faq mt-14">
                        <div className="mb-6 text-center">
                            <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Câu hỏi thường gặp</p>
                            <h2 className="mt-1.5 text-3xl font-extrabold tracking-tight md:text-4xl"
                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                Có thể bạn quan tâm
                            </h2>
                            <p className={`mt-2 text-sm ${muted}`}>
                                Một số thắc mắc phổ biến đã có câu trả lời sẵn — kiểm tra trước khi gửi tin nhắn.
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