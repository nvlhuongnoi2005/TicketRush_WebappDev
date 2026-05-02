import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

function NotFound() {
  const { isDark } = useTheme()

  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f6f7fb] text-slate-900'
  const muted = isDark ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className={`${bg} flex min-h-[80vh] flex-col items-center justify-center px-4 py-16`}>

      {/* ── Illustration ── */}
      <div className="relative mb-8 select-none">
        {/* big ghost number */}
        <p
          className="text-[9rem] font-extrabold leading-none tracking-[-0.06em] tabular-nums md:text-[12rem]"
          style={{
            background: isDark
              ? 'linear-gradient(170deg, #334155 0%, #0f172a 100%)'
              : 'linear-gradient(170deg, #cbd5e1 0%, #e2e8f0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </p>

      </div>

      {/* ── Copy ── */}
      <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        Trang này không tồn tại
      </h1>
      <p className={`mt-2 max-w-xs text-center text-sm leading-relaxed ${muted}`}>
        Đường dẫn đã bị xóa, đổi tên, hoặc chưa bao giờ tồn tại.
      </p>

      {/* ── Actions ── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/home"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:-translate-y-0.5 hover:opacity-95"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 3 5 8l5 5" />
          </svg>
          Về trang chủ
        </Link>
        <button
          type="button"
          onClick={() => window.history.back()}
          className={`inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark
            ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
            : 'border-slate-200 text-slate-600 hover:bg-white'
            }`}
        >
          Quay lại
        </button>
      </div>

      <p className={`mt-8 text-xs ${muted}`}>
        Nghĩ đây là lỗi?{' '}
        <a
          href="mailto:support@ticketrush.vn"
          className={`font-medium underline underline-offset-2 transition ${isDark ? 'text-sky-500 hover:text-sky-400' : 'text-sky-600 hover:text-sky-500'
            }`}
        >
          Liên hệ hỗ trợ
        </a>
      </p>
    </div>
  )
}

export default NotFound