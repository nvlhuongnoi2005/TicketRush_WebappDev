import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

const CSS = `
@keyframes legalFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes legalFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes legalShimmerBg {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.legal-hero      { animation: legalFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.05s both; }
.legal-meta      { animation: legalFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.2s both; }
.legal-toc       { animation: legalFadeUp 0.7s cubic-bezier(.22,1,.36,1) 0.3s both; }
.legal-section   { animation: legalFadeUp 0.6s cubic-bezier(.22,1,.36,1) both; }
.legal-cta       { animation: legalFadeIn 1s ease 0.5s both; }

.legal-hero-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: legalShimmerBg 14s ease infinite;
}

button:not(:disabled), a { cursor: pointer; }
`

// Slugify VN/EN titles to anchor ids
const slugify = (s) =>
    s.toString().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim().replace(/\s+/g, '-')

export default function LegalPageLayout({ eyebrow, title, lastUpdated, intro, sections, footerNote }) {
    const { isDark } = useTheme()
    const [activeId, setActiveId] = useState(sections[0]?.id || '')
    const observerRef = useRef(null)

    // Scroll-spy: highlight TOC item for the section currently in view
    useEffect(() => {
        if (!sections.length) return
        const ids = sections.map(s => s.id)
        const observer = new IntersectionObserver(
            (entries) => {
                // pick the entry closest to the top of viewport that's intersecting
                const visible = entries.filter(e => e.isIntersecting)
                if (visible.length > 0) {
                    const sorted = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
                    setActiveId(sorted[0].target.id)
                }
            },
            { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
        )
        ids.forEach(id => {
            const el = document.getElementById(id)
            if (el) observer.observe(el)
        })
        observerRef.current = observer
        return () => observer.disconnect()
    }, [sections])

    const handleTocClick = (e, id) => {
        e.preventDefault()
        const el = document.getElementById(id)
        if (!el) return
        const y = el.getBoundingClientRect().top + window.scrollY - 100
        window.scrollTo({ top: y, behavior: 'smooth' })
    }

    // Theme tokens
    const bg = isDark ? 'bg-slate-950' : 'bg-[#f6f7fb]'
    const text = isDark ? 'text-slate-100' : 'text-slate-900'
    const muted = isDark ? 'text-slate-400' : 'text-slate-500'
    const subtle = isDark ? 'text-slate-500' : 'text-slate-400'
    const card = isDark ? 'border-white/10 bg-slate-900/60' : 'border-slate-200/80 bg-white'
    const proseStrong = isDark ? 'text-slate-100' : 'text-slate-900'
    const proseBody = isDark ? 'text-slate-300' : 'text-slate-600'
    const tocActiveBg = isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-700'
    const tocIdleBg = isDark ? 'text-slate-400 hover:bg-white/5 hover:text-slate-200' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'

    return (
        <>
            <style>{CSS}</style>
            <div className={`min-h-screen ${bg} ${text}`}>

                {/* ── Hero banner ── */}
                <div className="legal-hero-bg relative overflow-hidden">
                    {/* grid pattern */}
                    <div
                        className="absolute inset-0 opacity-25"
                        style={{
                            backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
                            backgroundSize: '36px 36px',
                            maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 75%)',
                            WebkitMaskImage: 'radial-gradient(ellipse at top, black 0%, transparent 75%)',
                        }}
                    />
                    <div className="relative mx-auto max-w-6xl px-6 py-16 md:px-8 md:py-20">
                        <Link to="/" className="legal-hero inline-flex items-center gap-1.5 text-xs font-semibold text-white/80 transition hover:text-white">
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M13 8H3M7 4L3 8l4 4" />
                            </svg>
                            Quay về trang chủ
                        </Link>

                        <div className="legal-hero mt-6 flex items-center gap-4 md:gap-5">
                            <img
                                src="/ticketrush.png"
                                alt="TicketRush"
                                className="h-14 w-14 shrink-0 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.3)] md:h-16 md:w-16"
                            />
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/70">
                                    {eyebrow}
                                </p>
                                <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-white md:text-5xl"
                                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                    {title}
                                </h1>
                                {lastUpdated && (
                                    <div className="legal-meta mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                                            <rect x="2" y="3" width="12" height="11" rx="2" />
                                            <path d="M5 2v2M11 2v2M2 7h12" />
                                        </svg>
                                        Cập nhật: {lastUpdated}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    {/* fade to bg */}
                    <div className={`absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b ${isDark ? 'from-transparent to-slate-950' : 'from-transparent to-[#f6f7fb]'}`} />
                </div>

                <div className="mx-auto max-w-6xl px-6 py-10 md:px-8 md:py-14">
                    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">

                        {/* ═══ Sidebar TOC ═══ */}
                        <aside className="legal-toc">
                            <div className="lg:sticky lg:top-6">
                                <p className={`mb-3 text-[10px] font-bold uppercase tracking-[0.2em] ${subtle}`}>Mục lục</p>
                                <nav className="space-y-1">
                                    {sections.map((s, i) => (
                                        <a
                                            key={s.id}
                                            href={`#${s.id}`}
                                            onClick={(e) => handleTocClick(e, s.id)}
                                            className={`flex items-start gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${activeId === s.id ? tocActiveBg : tocIdleBg
                                                }`}
                                        >
                                            <span className={`shrink-0 text-[10px] font-bold tabular-nums ${activeId === s.id ? '' : 'opacity-50'}`}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span className="flex-1 leading-snug">{s.title}</span>
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </aside>

                        {/* ═══ Content ═══ */}
                        <main>
                            {intro && (
                                <div className={`legal-section mb-8 rounded-2xl border p-5 ${isDark ? 'border-sky-400/20 bg-sky-500/5' : 'border-sky-100 bg-sky-50/40'
                                    }`}>
                                    <p className={`text-sm leading-relaxed ${proseBody}`}>{intro}</p>
                                </div>
                            )}

                            <article className="space-y-10">
                                {sections.map((s, i) => (
                                    <section
                                        key={s.id}
                                        id={s.id}
                                        className="legal-section scroll-mt-24"
                                        style={{ animationDelay: `${0.1 + i * 0.05}s` }}
                                    >
                                        <div className="mb-4 flex items-center gap-3">
                                            <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'
                                                }`}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <h2 className={`text-2xl font-extrabold tracking-tight ${proseStrong}`}
                                                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                                                {s.title}
                                            </h2>
                                        </div>

                                        <div className={`space-y-3 text-[15px] leading-relaxed ${proseBody}`}>
                                            {s.body.map((block, bi) => {
                                                if (typeof block === 'string') {
                                                    return <p key={bi}>{block}</p>
                                                }
                                                if (block.type === 'list') {
                                                    return (
                                                        <ul key={bi} className="space-y-2 pl-1">
                                                            {block.items.map((item, ii) => (
                                                                <li key={ii} className="flex items-start gap-2.5">
                                                                    <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${isDark ? 'bg-sky-400' : 'bg-sky-500'}`} />
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )
                                                }
                                                if (block.type === 'callout') {
                                                    return (
                                                        <div key={bi} className={`flex items-start gap-3 rounded-xl border p-4 ${isDark ? 'border-amber-400/20 bg-amber-500/5' : 'border-amber-100 bg-amber-50/40'
                                                            }`}>
                                                            <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
                                                                className={`mt-0.5 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                                                <circle cx="8" cy="8" r="6.5" />
                                                                <path d="M8 5v3.5M8 11h.01" />
                                                            </svg>
                                                            <p className={`text-sm ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>{block.text}</p>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            })}
                                        </div>
                                    </section>
                                ))}
                            </article>

                            {/* Footer note + CTA */}
                            <div className={`legal-cta mt-14 rounded-2xl border p-6 ${card}`}>
                                <p className={`text-sm leading-relaxed ${proseBody}`}>
                                    {footerNote || 'Nếu có thắc mắc về tài liệu này, hãy liên hệ với chúng tôi.'}
                                </p>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <Link
                                        to="/contact-us"
                                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/20 transition hover:opacity-90 hover:-translate-y-0.5"
                                    >
                                        Liên hệ hỗ trợ
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M3 8h10M9 4l4 4-4 4" />
                                        </svg>
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                                        className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-white'
                                            }`}
                                    >
                                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                            <path d="M8 13V3M4 7l4-4 4 4" />
                                        </svg>
                                        Lên đầu trang
                                    </button>
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </>
    )
}

export { slugify }