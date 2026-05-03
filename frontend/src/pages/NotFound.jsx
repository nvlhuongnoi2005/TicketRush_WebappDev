import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

const CSS = `
@keyframes nfFloat1 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(30px, -20px) scale(1.05); }
}
@keyframes nfFloat2 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-25px, 25px) scale(0.95); }
}
@keyframes nfFloat3 {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(15px, 30px) scale(1.08); }
}
@keyframes nfFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nfFadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@keyframes nfGlitchR {
  0%, 92%, 100% { transform: translate(0, 0); opacity: 0; }
  93%, 96%      { transform: translate(3px, -1px); opacity: 0.45; }
}
@keyframes nfGlitchB {
  0%, 92%, 100% { transform: translate(0, 0); opacity: 0; }
  93%, 96%      { transform: translate(-3px, 1px); opacity: 0.45; }
}
@keyframes nfGlitchSlice {
  0%, 91%, 100% { clip-path: inset(0 0 0 0); }
  93%           { clip-path: inset(40% 0 45% 0); }
  94%           { clip-path: inset(70% 0 15% 0); }
  95%           { clip-path: inset(20% 0 65% 0); }
}
@keyframes nfTicketTilt {
  0%, 100% { transform: rotate(-8deg) translateY(0); }
  50%      { transform: rotate(-6deg) translateY(-8px); }
}
@keyframes nfPulse {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 1; }
}
@keyframes nfGridDrift {
  from { transform: translate(0, 0); }
  to   { transform: translate(40px, 40px); }
}
@keyframes nfShimmer {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.nf-orb1 { animation: nfFloat1 14s ease-in-out infinite; }
.nf-orb2 { animation: nfFloat2 18s ease-in-out infinite; }
.nf-orb3 { animation: nfFloat3 16s ease-in-out infinite; }

.nf-grid { animation: nfGridDrift 20s linear infinite; }

.nf-404-base   { animation: nfFadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.1s both, nfGlitchSlice 7s infinite 2s; }
.nf-404-r      { animation: nfFadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.1s both, nfGlitchR 7s infinite 2s; }
.nf-404-b      { animation: nfFadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.1s both, nfGlitchB 7s infinite 2s; }
.nf-ticket     { animation: nfFadeUp 0.9s cubic-bezier(.22,1,.36,1) 0.3s both, nfTicketTilt 5s ease-in-out infinite 1.2s; }

.nf-title    { animation: nfFadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.35s both; }
.nf-desc     { animation: nfFadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.5s both; }
.nf-actions  { animation: nfFadeUp 0.8s cubic-bezier(.22,1,.36,1) 0.65s both; }
.nf-foot     { animation: nfFadeIn 1s ease 0.9s both; }

.nf-pulse-dot { animation: nfPulse 2s ease-in-out infinite; }

.nf-btn-shimmer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%);
  transform: translateX(-100%);
  pointer-events: none;
}
.nf-btn-shimmer:hover::before {
  animation: nfShimmer 0.8s ease;
}

button:not(:disabled), a { cursor: pointer; }
`

function NotFound() {
  const { isDark } = useTheme()

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const muted = isDark ? 'text-slate-500' : 'text-slate-400'

  // Color tokens for 404 layers
  const num404 = isDark
    ? 'linear-gradient(170deg, #475569 0%, #1e293b 60%, #0f172a 100%)'
    : 'linear-gradient(170deg, #cbd5e1 0%, #e2e8f0 60%, #f1f5f9 100%)'

  // Grid color
  const gridColor = isDark ? 'rgba(148,163,184,0.07)' : 'rgba(15,23,42,0.05)'

  return (
    <>
      <style>{CSS}</style>
      <div className={`${bg} relative flex min-h-[65vh] flex-col items-center justify-center overflow-hidden px-4 py-8`}>

        {/* ── Background: animated grid ── */}
        <div
          className="nf-grid pointer-events-none absolute inset-0 opacity-60"
          style={{
            backgroundImage: `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 0%, transparent 75%)',
          }}
        />

        {/* ── Background: floating orbs ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="nf-orb1 absolute -left-20 top-10 h-72 w-72 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #0ea5e9 0%, transparent 70%)' }}
          />
          <div
            className="nf-orb2 absolute right-0 top-1/3 h-80 w-80 rounded-full opacity-25 blur-3xl"
            style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
          />
          <div
            className="nf-orb3 absolute bottom-10 left-1/3 h-64 w-64 rounded-full opacity-20 blur-3xl"
            style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
          />
        </div>

        {/* ── Content ── */}
        <div className="relative z-10 flex flex-col items-center">

          {/* status pill */}
          <div className={`nf-foot mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-[11px] font-semibold backdrop-blur-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-500'
            }`}>
            <span className="nf-pulse-dot h-1.5 w-1.5 rounded-full bg-rose-500" />
            ERROR · 404
          </div>

          {/* ── 404 illustration ── */}
          <div className="relative mb-2 select-none">
            {/* glitch layers (red + blue) - sit behind the main number */}
            <p
              className="nf-404-r absolute inset-0 text-[9rem] font-extrabold leading-none tracking-[-0.06em] tabular-nums md:text-[12rem]"
              style={{ color: '#f43f5e', mixBlendMode: isDark ? 'screen' : 'multiply' }}
              aria-hidden="true"
            >
              404
            </p>
            <p
              className="nf-404-b absolute inset-0 text-[9rem] font-extrabold leading-none tracking-[-0.06em] tabular-nums md:text-[12rem]"
              style={{ color: '#0ea5e9', mixBlendMode: isDark ? 'screen' : 'multiply' }}
              aria-hidden="true"
            >
              404
            </p>

            {/* main 404 (gradient fill, with glitch slice) */}
            <p
              className="nf-404-base relative text-[9rem] font-extrabold leading-none tracking-[-0.06em] tabular-nums md:text-[12rem]"
              style={{
                background: num404,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              404
            </p>

            {/* torn ticket overlay - sits on top of the "0" */}
            <div className="nf-ticket pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <svg width="120" height="80" viewBox="0 0 120 80" fill="none" className="drop-shadow-2xl md:scale-125">
                {/* left half */}
                <path
                  d="M4 12 Q4 8 8 8 L52 8 L48 16 L54 24 L48 32 L54 40 L48 48 L54 56 L48 64 L52 72 L8 72 Q4 72 4 68 Z"
                  fill="url(#ticketGrad)"
                  stroke={isDark ? '#1e293b' : '#cbd5e1'}
                  strokeWidth="1"
                />
                {/* right half (offset, rotated slightly to look "torn") */}
                <g transform="translate(8, 4) rotate(4 86 40)">
                  <path
                    d="M58 8 L112 8 Q116 8 116 12 L116 68 Q116 72 112 72 L58 72 L64 64 L58 56 L64 48 L58 40 L64 32 L58 24 L64 16 Z"
                    fill="url(#ticketGrad)"
                    stroke={isDark ? '#1e293b' : '#cbd5e1'}
                    strokeWidth="1"
                  />
                  <line x1="78" y1="20" x2="104" y2="20" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
                  <line x1="78" y1="28" x2="98" y2="28" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
                </g>
                {/* left side details */}
                <line x1="14" y1="20" x2="40" y2="20" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="14" y1="28" x2="34" y2="28" stroke={isDark ? '#475569' : '#94a3b8'} strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="ticketGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* ── Copy ── */}
          <h1 className={`nf-title display-font text-center text-2xl font-extrabold tracking-tight md:text-3xl ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            Trang này không tồn tại
          </h1>
          <p className={`nf-desc mt-3 max-w-sm text-center text-sm leading-relaxed ${muted}`}>
            Đường dẫn đã bị xóa, đổi tên, hoặc chưa bao giờ tồn tại. Hãy quay về trang chủ để tiếp tục khám phá sự kiện.
          </p>

          {/* ── Actions ── */}
          <div className="nf-actions mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/home"
              className="nf-btn-shimmer group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-sky-500/30"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8 L8 2 L14 8" />
                <path d="M4 7 V14 H12 V7" />
              </svg>
              <span className="relative">Về trang chủ</span>
            </Link>
            <button
              type="button"
              onClick={() => window.history.back()}
              className={`group inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold backdrop-blur-sm transition hover:-translate-y-0.5 ${isDark
                ? 'border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                : 'border-slate-200 bg-white/60 text-slate-600 hover:border-slate-300 hover:bg-white'
                }`}
            >
              Quay lại
            </button>
          </div>

          {/* ── Footer ── */}
          <p className={`nf-foot mt-10 text-xs ${muted}`}>
            Nghĩ đây là lỗi?{' '}
            <a
              href="mailto:support@ticketrush.vn"
              className={`font-semibold underline underline-offset-4 transition ${isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-500'
                }`}
            >
              Liên hệ hỗ trợ
            </a>
          </p>
        </div>
      </div>
    </>
  )
}

export default NotFound