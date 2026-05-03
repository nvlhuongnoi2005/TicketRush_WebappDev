import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { adminApi } from '../lib/api'

// ─── Animations ───────────────────────────────────────────────────────────────
const CSS = `
@keyframes admFadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes admFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes admScaleIn {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes admShimmer {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes admPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
@keyframes admDrawLine { to { stroke-dashoffset: 0; } }
@keyframes admSparkle {
  0%, 100% { opacity: 1; transform: scale(1) rotate(0deg); }
  50%      { opacity: 0.7; transform: scale(1.1) rotate(180deg); }
}
@keyframes admDots {
  0%, 20%   { opacity: 0.2; transform: scale(0.8); }
  50%       { opacity: 1; transform: scale(1); }
  80%, 100% { opacity: 0.2; transform: scale(0.8); }
}
@keyframes admGradientFlow {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes admDropdownIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes admHeroZoom {
  from { transform: scale(1.08); }
  to   { transform: scale(1); }
}

.adm-fade-up   { animation: admFadeUp 0.6s cubic-bezier(.22,1,.36,1) both; }
.adm-fade-in   { animation: admFadeIn 0.5s ease both; }
.adm-scale-in  { animation: admScaleIn 0.5s cubic-bezier(.22,1,.36,1) both; }
.adm-d-100 { animation-delay: 0.1s; }
.adm-d-200 { animation-delay: 0.2s; }
.adm-d-300 { animation-delay: 0.3s; }
.adm-d-400 { animation-delay: 0.4s; }
.adm-d-500 { animation-delay: 0.5s; }
.adm-d-600 { animation-delay: 0.6s; }

.adm-ai-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: admShimmer 8s ease infinite;
}
.adm-ai-active-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 30%, #a855f7 60%, #ec4899 100%);
  background-size: 300% 300%;
  animation: admGradientFlow 3s ease infinite;
}
.adm-sparkle { animation: admSparkle 3s ease infinite; }
.adm-pulse-dot { animation: admPulse 1.5s ease infinite; }

.adm-line-draw {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: admDrawLine 1.5s cubic-bezier(.22,1,.36,1) 0.3s forwards;
}

.adm-dot-1 { animation: admDots 1.4s ease infinite; }
.adm-dot-2 { animation: admDots 1.4s ease 0.2s infinite; }
.adm-dot-3 { animation: admDots 1.4s ease 0.4s infinite; }

.adm-dropdown-in { animation: admDropdownIn 0.2s cubic-bezier(.22,1,.36,1) both; }
.adm-hero-zoom { animation: admHeroZoom 1.2s cubic-bezier(.22,1,.36,1) both; }

button:not(:disabled), a, select { cursor: pointer; }
`

const fmtVND = (n) => `${Number(n || 0).toLocaleString('vi-VN')} ₫`
const fmtNum = (n) => Number(n || 0).toLocaleString('vi-VN')

const Icon = {
  ticket: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" /><path d="M7 3v10" strokeDasharray="2 2" /></svg>,
  calendar: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>,
  cash: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6" /><path d="M8 4.5v1M8 10.5v1M5.5 7h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H10" strokeLinecap="round" /></svg>,
  users: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="6" cy="5.5" r="2.5" /><path d="M2 13c0-2.2 1.8-4 4-4s4 1.8 4 4M11 8c1.5 0 3 1 3 3" /></svg>,
  pulse: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M2 8h2.5L6 5l2 7 2-7 1.5 3H14" /></svg>,
  sparkle: <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z" /></svg>,
  trend: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12l4-4 3 3 5-6" /><path d="M10 5h4v4" /></svg>,
  seat: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" /></svg>,
  pin: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" /><path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" /></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14 7A6 6 0 0 0 3.5 4.5M2 9a6 6 0 0 0 10.5 2.5" /><path d="M14 2v4h-4M2 14v-4h4" /></svg>,
  globe: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6.5" /><path d="M2 8h12M8 1.5C9.5 4 9.5 12 8 14.5M8 1.5C6.5 4 6.5 12 8 14.5" /></svg>,
  chevron: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6l4 4 4-4" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8 3 3 7-7" /></svg>,
  search: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="7" cy="7" r="5" /><path d="m11 11 3 3" /></svg>,
  status: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><circle cx="8" cy="8" r="2" /><path d="M2 8a6 6 0 0 1 12 0M4 8a4 4 0 0 1 8 0" /></svg>,
  layout: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>,

  // Dashboard icon — grid with pulse line overlay
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1.5" />
      <rect x="11" y="2" width="7" height="7" rx="1.5" />
      <rect x="2" y="11" width="7" height="7" rx="1.5" />
      <rect x="11" y="11" width="7" height="7" rx="1.5" />
    </svg>
  ),

  // Event management — calendar with list lines
  manageEvents: (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="12" height="11" rx="1.5" />
      <path d="M5 2v2M11 2v2M2 7h12" />
      <path d="M5 10h4M5 12.5h6" />
    </svg>
  ),
}

// ─── Custom Dropdown Selector ─────────────────────────────────────────────────
function ScopeSelector({ scope, events, onChange, isDark }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!open) setSearch('')
  }, [open])

  const isAll = scope === 'all'
  const currentEvent = !isAll ? events.find(e => e.id === scope) : null

  const filteredEvents = useMemo(() => {
    if (!search.trim()) return events
    const q = search.toLowerCase()
    return events.filter(e =>
      e.title?.toLowerCase().includes(q) ||
      e.artist?.toLowerCase().includes(q) ||
      e.venue_name?.toLowerCase().includes(q)
    )
  }, [events, search])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`group flex min-w-[280px] items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all ${open ? 'shadow-lg' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'
          } ${isAll
            ? 'border-sky-500/50 bg-gradient-to-r from-sky-500 to-sky-400 text-white'
            : 'border-indigo-500/50 bg-gradient-to-r from-indigo-500 via-indigo-500 to-purple-500 text-white'
          }`}
      >
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm`}>
          {isAll ? Icon.globe : Icon.ticket}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
            {isAll ? 'Phạm vi' : 'Sự kiện đã chọn'}
          </p>
          <p className="truncate text-sm font-extrabold">
            {isAll ? 'Toàn bộ hệ thống' : (currentEvent?.title || 'Đang tải...')}
          </p>
        </div>
        <span className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}>{Icon.chevron}</span>
      </button>

      {open && (
        <div
          className={`adm-dropdown-in absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
            }`}
          style={{ minWidth: 360 }}
        >
          <div className={`border-b px-3 py-2.5 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="relative">
              <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {Icon.search}
              </span>
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm sự kiện theo tên, nghệ sĩ, địa điểm..."
                className={`w-full rounded-lg border px-8 py-1.5 text-sm outline-none transition ${isDark
                  ? 'border-slate-800 bg-slate-800/50 text-white placeholder-slate-500 focus:border-sky-400/60'
                  : 'border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-sky-400/70 focus:bg-white'
                  }`}
              />
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-1.5">
            <button
              type="button"
              onClick={() => handleSelect('all')}
              className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${isAll
                ? (isDark ? 'bg-sky-500/15' : 'bg-sky-50')
                : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')
                }`}
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isAll
                ? 'bg-gradient-to-br from-sky-500 to-sky-400 text-white shadow-md shadow-sky-500/30'
                : (isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-50 text-sky-600')
                }`}>
                {Icon.globe}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Toàn bộ hệ thống</p>
                <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  {events.length} sự kiện · thống kê tổng hợp
                </p>
              </div>
              {isAll && <span className={`shrink-0 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>{Icon.check}</span>}
            </button>

            <div className="my-1.5 flex items-center gap-2 px-3">
              <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Sự kiện cụ thể</span>
              <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
            </div>

            {filteredEvents.length === 0 ? (
              <p className={`py-6 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Không tìm thấy sự kiện phù hợp</p>
            ) : (
              filteredEvents.map((ev, i) => {
                const active = ev.id === scope
                const statusCfg = {
                  on_sale: { dot: 'bg-emerald-500', label: 'Đang bán' },
                  sold_out: { dot: 'bg-rose-500', label: 'Hết vé' },
                  finished: { dot: 'bg-slate-400', label: 'Kết thúc' },
                  cancelled: { dot: 'bg-orange-500', label: 'Đã hủy' },
                  draft: { dot: 'bg-slate-400', label: 'Nháp' },
                }[ev.status] || { dot: 'bg-slate-400', label: '' }

                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => handleSelect(ev.id)}
                    className={`adm-fade-in group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${active
                      ? (isDark ? 'bg-indigo-500/15' : 'bg-indigo-50')
                      : (isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50')
                      }`}
                    style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
                  >
                    <div className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      {ev.banner_url
                        ? <img src={ev.banner_url} alt="" className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-base">🎫</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`truncate text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{ev.title}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                        <span className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          {statusCfg.label}{ev.venue_name && ` · ${ev.venue_name}`}
                        </span>
                      </div>
                    </div>
                    {active && <span className={`shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>{Icon.check}</span>}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Quick info card ──────────────────────────────────────────────────────────
function QuickInfoCard({ icon, label, value, accent, isDark, delay = 0 }) {
  return (
    <div
      className={`adm-fade-up rounded-2xl border p-3.5 transition hover:-translate-y-0.5 ${isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-2.5">
        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent}`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
          <p className={`mt-0.5 truncate text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{value}</p>
        </div>
      </div>
    </div>
  )
}

// ─── KPI Card ────────────────────────────────────────────────────────────────
function KpiCard({ label, value, hint, sparkData = [], color = 'sky', icon, isDark, delay = 0 }) {
  const colorMap = {
    sky: { fill: 'from-sky-500 to-sky-400', text: isDark ? 'text-sky-400' : 'text-sky-600', bg: isDark ? 'bg-sky-500/15' : 'bg-sky-50', stroke: '#0ea5e9' },
    indigo: { fill: 'from-indigo-500 to-indigo-400', text: isDark ? 'text-indigo-400' : 'text-indigo-600', bg: isDark ? 'bg-indigo-500/15' : 'bg-indigo-50', stroke: '#6366f1' },
    emerald: { fill: 'from-emerald-500 to-emerald-400', text: isDark ? 'text-emerald-400' : 'text-emerald-600', bg: isDark ? 'bg-emerald-500/15' : 'bg-emerald-50', stroke: '#10b981' },
    violet: { fill: 'from-violet-500 to-violet-400', text: isDark ? 'text-violet-400' : 'text-violet-600', bg: isDark ? 'bg-violet-500/15' : 'bg-violet-50', stroke: '#8b5cf6' },
    amber: { fill: 'from-amber-500 to-amber-400', text: isDark ? 'text-amber-400' : 'text-amber-600', bg: isDark ? 'bg-amber-500/15' : 'bg-amber-50', stroke: '#f59e0b' },
    rose: { fill: 'from-rose-500 to-rose-400', text: isDark ? 'text-rose-400' : 'text-rose-600', bg: isDark ? 'bg-rose-500/15' : 'bg-rose-50', stroke: '#f43f5e' },
  }
  const c = colorMap[color] || colorMap.sky

  const sparkPath = useMemo(() => {
    if (!sparkData.length) return ''
    const max = Math.max(...sparkData, 1)
    const min = Math.min(...sparkData, 0)
    const range = max - min || 1
    const w = 80, h = 24
    const step = w / Math.max(sparkData.length - 1, 1)
    return sparkData.map((v, i) => {
      const x = i * step
      const y = h - ((v - min) / range) * h
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    }).join(' ')
  }, [sparkData])

  return (
    <div
      className={`adm-fade-up group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${isDark ? 'border-slate-800 bg-slate-900 hover:border-slate-700' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-slate-200/60'}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`absolute left-0 top-0 h-1 w-full bg-gradient-to-r ${c.fill} opacity-80`} />
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${c.bg} ${c.text}`}>{icon}</div>
      </div>
      <p className={`mt-3 text-xs font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tabular-nums ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{value}</p>
      {hint && <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{hint}</p>}
      {sparkData.length > 1 && (
        <svg viewBox="0 0 80 24" className="mt-3 h-6 w-full" preserveAspectRatio="none">
          <path d={sparkPath} fill="none" stroke={c.stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="adm-line-draw" />
        </svg>
      )}
    </div>
  )
}

// ─── AI Insights Card ─────────────────────────────────────────────────────────
// Insight type icons
const InsightIcon = {
  positive: (
    <svg
      width="13"
      height="13"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="5.5" />
      <path d="M4.8 7.2L6.3 8.7L9.4 5.6" />
    </svg>
  ),
  warning: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 2 1.5 12h11L7 2Z" />
      <path d="M7 6v2.5M7 10.5v.5" strokeWidth="2.2" />
    </svg>
  ),
  info: (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="7" r="5.5" />
      <path d="M7 6.5v3.5M7 4.5v.5" strokeWidth="2.2" />
    </svg>
  ),
}

// AI background images — một mảng ảnh Unsplash concert/event đẹp
const AI_BG_IMAGES = [
  'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200&q=80', // concert crowd
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80', // stage lights
  'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&q=80', // festival
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&q=80', // music event
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&q=80', // spotlight
]

function AiInsightsCard({ scope, eventId, isDark }) {
  const [state, setState] = useState('idle')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  // Chọn ảnh random một lần khi mount
  const [bgImg] = useState(() => AI_BG_IMAGES[Math.floor(Math.random() * AI_BG_IMAGES.length)])

  useEffect(() => {
    setState('idle')
    setData(null)
    setError('')
  }, [scope, eventId])

  const handleGenerate = async () => {
    setState('loading')
    setError('')
    try {
      const res = await adminApi.aiInsights({
        scope: scope === 'all' ? 'all' : 'event',
        event_id: scope === 'all' ? null : eventId,
      })
      setData(res)
      setState('done')
    } catch (err) {
      setError(err.message || 'Không thể tạo phân tích')
      setState('error')
    }
  }

  return (
    <div className={`adm-scale-in adm-d-200 relative overflow-hidden rounded-3xl text-white shadow-xl shadow-indigo-500/20`}
      style={{ minHeight: 180 }}>

      {/* Layer 1: ảnh nền 30% opacity */}
      <div className="absolute inset-0">
        <img
          src={bgImg}
          alt=""
          className="h-full w-full object-cover"
          style={{ opacity: 0.30 }}
        />
        {/* overlay gradient để chữ đọc được */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, rgba(14,165,233,0.85) 0%, rgba(99,102,241,0.88) 45%, rgba(168,85,247,0.85) 100%)'
        }} />
      </div>

      {/* Layer 2: gradient shimmer khi loading (thay ảnh) */}
      {state === 'loading' && (
        <div className="adm-ai-active-bg absolute inset-0 opacity-90" />
      )}

      {/* Decorative grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at top right, black, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top right, black, transparent 70%)',
        }}
      />

      {/* Content */}
      <div className="relative p-6">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <span className={`text-amber-200 ${state === 'loading' ? 'adm-sparkle' : ''}`}>{Icon.sparkle}</span>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">AI Insights · Powered by Gemini</p>
            <h3 className="text-base font-extrabold">Phân tích thông minh</h3>
          </div>
          {state === 'done' && (
            <button onClick={handleGenerate}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-bold backdrop-blur-sm transition hover:bg-white/25">
              {Icon.refresh} Phân tích lại
            </button>
          )}
        </div>

        {state === 'idle' && (
          <div className="adm-fade-in py-2">
            <p className="mb-4 text-sm leading-relaxed text-white/85">
              Yêu cầu Gemini AI phân tích dữ liệu hiện tại để đưa ra các nhận định và gợi ý hành động cụ thể cho {scope === 'all' ? 'toàn bộ hệ thống' : 'sự kiện này'}.
            </p>
            <button onClick={handleGenerate}
              className="group inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl">
              <span className="adm-sparkle text-amber-500">{Icon.sparkle}</span>
              Tạo phân tích
              <span className="rounded-md bg-indigo-100 px-1.5 py-0.5 text-[10px] font-extrabold text-indigo-700">AI</span>
            </button>
          </div>
        )}

        {state === 'loading' && (
          <div className="adm-fade-in py-3">
            <div className="flex items-center gap-2 text-sm text-white/90">
              <span className="adm-dot-1 inline-block h-2 w-2 rounded-full bg-white" />
              <span className="adm-dot-2 inline-block h-2 w-2 rounded-full bg-white" />
              <span className="adm-dot-3 inline-block h-2 w-2 rounded-full bg-white" />
              <span className="ml-2 font-medium">Gemini đang phân tích dữ liệu...</span>
            </div>
            <div className="mt-4 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 backdrop-blur-sm">
                  <div className="mt-0.5 h-5 w-5 shrink-0 animate-pulse rounded-md bg-white/20" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 animate-pulse rounded bg-white/20" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-white/15" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="adm-fade-in">
            <p className="mb-3 text-sm text-rose-100">⚠ {error}</p>
            <button onClick={handleGenerate}
              className="rounded-xl bg-white/20 px-4 py-2 text-xs font-bold backdrop-blur-sm transition hover:bg-white/30">
              Thử lại
            </button>
          </div>
        )}

        {state === 'done' && data && (
          <div className="adm-fade-in space-y-2.5">
            {data.summary && (
              <div className="mb-3 rounded-xl border border-white/20 bg-white/15 px-3.5 py-2.5 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70">Tóm tắt</p>
                <p className="mt-0.5 text-sm font-medium leading-relaxed">{data.summary}</p>
              </div>
            )}

            {data.insights?.length === 0 ? (
              <p className="text-sm text-white/80">Chưa đủ dữ liệu để đưa ra phân tích cụ thể.</p>
            ) : (
              <ul className="space-y-2">
                {data.insights.map((it, i) => {
                  // positive = emerald, warning = rose/red, info = sky/cyan
                  const typeCfg = {
                    positive: {
                      wrap: 'border-emerald-300/30 bg-emerald-400/15',
                      icon: 'bg-emerald-300/30 text-emerald-100',
                    },
                    warning: {
                      wrap: 'border-rose-300/30 bg-rose-400/15',
                      icon: 'bg-rose-300/30 text-rose-100',
                    },
                    info: {
                      wrap: 'border-sky-300/30 bg-sky-400/15',
                      icon: 'bg-sky-300/30 text-sky-100',
                    },
                  }[it.type] || {
                    wrap: 'border-white/15 bg-white/10',
                    icon: 'bg-white/20 text-white',
                  }

                  return (
                    <li key={i}
                      className={`adm-fade-up flex items-start gap-2.5 rounded-xl border px-3 py-2.5 backdrop-blur-sm ${typeCfg.wrap}`}
                      style={{ animationDelay: `${i * 80}ms` }}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${typeCfg.icon}`}>
                        {InsightIcon[it.type] || InsightIcon.info}
                      </span>
                      <p className="text-sm leading-relaxed">{it.text}</p>
                    </li>
                  )
                })}
              </ul>
            )}

            {data.generated_at && (
              <p className="mt-3 text-[10px] text-white/50">
                Tạo lúc: {new Date(data.generated_at).toLocaleString('vi-VN')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Donut chart ──────────────────────────────────────────────────────────────
function DonutChart({ slices, isDark, centerLabel }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (!total) return <p className={`mt-4 text-center text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chưa có dữ liệu.</p>

  const CX = 90, CY = 90, R = 70, ri = 48
  const holeColor = isDark ? '#0f172a' : '#ffffff'
  const nonZero = slices.filter(s => s.value > 0)
  let angle = -Math.PI / 2
  const paths = []

  if (nonZero.length === 1) {
    paths.push({ full: true, color: nonZero[0].color })
  } else {
    for (const s of slices) {
      if (s.value === 0) continue
      const pct = s.value / total
      const sweep = pct * 2 * Math.PI
      const endAngle = angle + sweep
      const x1 = CX + R * Math.cos(angle), y1 = CY + R * Math.sin(angle)
      const x2 = CX + R * Math.cos(endAngle), y2 = CY + R * Math.sin(endAngle)
      const xi1 = CX + ri * Math.cos(angle), yi1 = CY + ri * Math.sin(angle)
      const xi2 = CX + ri * Math.cos(endAngle), yi2 = CY + ri * Math.sin(endAngle)
      const large = pct > 0.5 ? 1 : 0
      paths.push({
        d: `M${x1.toFixed(2)} ${y1.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L${xi2.toFixed(2)} ${yi2.toFixed(2)} A${ri} ${ri} 0 ${large} 0 ${xi1.toFixed(2)} ${yi1.toFixed(2)} Z`,
        color: s.color,
      })
      angle = endAngle
    }
  }

  return (
    <div className="mt-2 flex flex-wrap items-center justify-center gap-6">
      <div className="relative">
        <svg width="180" height="180" viewBox="0 0 180 180">
          {paths.map((p, i) =>
            p.full
              ? <g key={i}><circle cx={CX} cy={CY} r={R} fill={p.color} /><circle cx={CX} cy={CY} r={ri} fill={holeColor} /></g>
              : <path key={i} d={p.d} fill={p.color} className="adm-fade-in" style={{ animationDelay: `${i * 100}ms` }} />
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className={`text-2xl font-extrabold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{total}</p>
          <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{centerLabel}</p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        {slices.map((s, i) => {
          const pct = total ? Math.round((s.value / total) * 100) : 0
          return (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-3 shrink-0 rounded-md" style={{ background: s.color }} />
              <span className={`${isDark ? 'text-slate-300' : 'text-slate-700'} text-sm`}>
                {s.label}: <span className="font-bold tabular-nums">{s.value}</span>
                <span className={`ml-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>({pct}%)</span>
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Bar chart ────────────────────────────────────────────────────────────────
function BarChart({ bars, isDark, gradient = 'from-violet-500 to-sky-400' }) {
  const max = Math.max(...bars.map(b => b.value), 1)
  return (
    <div className="mt-2 space-y-2.5">
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex items-center gap-3 adm-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
          <span className={`w-14 shrink-0 text-right text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{bar.label}</span>
          <div className={`h-2.5 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
            <div className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-700`} style={{ width: `${(bar.value / max) * 100}%` }} />
          </div>
          <span className={`w-10 shrink-0 text-right text-xs font-bold tabular-nums ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{bar.value}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Revenue area chart ───────────────────────────────────────────────────────
function RevenueAreaChart({ data, isDark }) {
  if (!data?.length) return null
  const W = 700, H = 180, padX = 36, padY = 16
  const max = Math.max(...data.map(d => d.revenue), 1)
  const step = (W - padX * 2) / Math.max(data.length - 1, 1)
  const points = data.map((d, i) => ({
    x: padX + i * step,
    y: padY + (1 - d.revenue / max) * (H - padY * 2),
    val: d.revenue, label: d.date,
  }))
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${H - padY} L${points[0].x.toFixed(1)},${H - padY} Z`
  const gridColor = isDark ? '#1e293b' : '#e2e8f0'
  const labelColor = isDark ? '#64748b' : '#94a3b8'

  return (
    <div className="mt-3 overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="min-w-full" style={{ minWidth: 600 }}>
        <defs>
          <linearGradient id="revArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="revLine" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0ea5e9" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <line key={i} x1={padX} x2={W - padX}
            y1={padY + p * (H - padY * 2)} y2={padY + p * (H - padY * 2)}
            stroke={gridColor} strokeDasharray="2 4" strokeWidth="1" />
        ))}
        {[0, 0.5, 1].map((p, i) => (
          <text key={i} x={padX - 6} y={padY + (1 - p) * (H - padY * 2) + 3}
            fill={labelColor} fontSize="9" textAnchor="end" fontFamily="DM Sans, sans-serif">
            {p === 0 ? '0' : p === 1 ? `${Math.round(max / 1000)}k` : `${Math.round(max / 2000)}k`}
          </text>
        ))}
        <path d={areaPath} fill="url(#revArea)" className="adm-fade-in" />
        <path d={linePath} fill="none" stroke="url(#revLine)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="adm-line-draw" />
        {points.map((p, i) => (
          <g key={i} className="adm-fade-in" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
            <circle cx={p.x} cy={p.y} r="4" fill={isDark ? '#0f172a' : '#fff'} stroke="#6366f1" strokeWidth="2" />
          </g>
        ))}
        {points.map((p, i) => i % Math.max(Math.ceil(points.length / 7), 1) === 0 && (
          <text key={i} x={p.x} y={H - 2} fill={labelColor} fontSize="9" textAnchor="middle" fontFamily="DM Sans, sans-serif">
            {p.label.slice(5)}
          </text>
        ))}
      </svg>
    </div>
  )
}

// ─── Top events leaderboard ───────────────────────────────────────────────────
function TopEventsList({ events, isDark }) {
  if (!events?.length) return <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Chưa có dữ liệu.</p>

  const sorted = [...events].sort((a, b) =>
    (b.revenue || 0) - (a.revenue || 0) || (b.tickets_sold || 0) - (a.tickets_sold || 0)
  )
  const maxRevenue = Math.max(...sorted.map(e => e.revenue || 0), 1)

  return (
    <div className="mt-3 space-y-2.5">
      {sorted.slice(0, 5).map((ev, i) => {
        const pct = ((ev.revenue || 0) / maxRevenue) * 100
        return (
          <div key={ev.id} className="adm-fade-up flex items-center gap-3" style={{ animationDelay: `${i * 80}ms` }}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-extrabold ${i === 0 ? 'bg-amber-400 text-white'
              : i === 1 ? 'bg-slate-400 text-white'
                : i === 2 ? 'bg-amber-700 text-white'
                  : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
              }`}>{i + 1}</span>
            <div className="flex-1 min-w-0">
              <p className={`truncate text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{ev.title}</p>
              <div className={`mt-1 h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 transition-all duration-1000" style={{ width: `${pct}%` }} />
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className={`text-sm font-bold tabular-nums ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{fmtVND(ev.revenue || 0)}</p>
              <p className={`text-[10px] tabular-nums ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{fmtNum(ev.tickets_sold || 0)} vé</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const { isDark } = useTheme()
  const { user, authLoading } = useAuth()
  const navigate = useNavigate()

  const [scope, setScope] = useState('all')
  const [allDashboard, setAllDashboard] = useState(null)
  const [eventDashboard, setEventDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [audience, setAudience] = useState(null)
  const [seatStats, setSeatStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') navigate('/', { replace: true })
  }, [user, authLoading, navigate])

  useEffect(() => {
    let first = true
    const fetchGlobal = () => {
      if (!first) setRefreshing(true)
      Promise.all([adminApi.events.list(), adminApi.stats.audience()])
        .then(([evts, aud]) => { setEvents(evts); setAudience(aud) })
        .catch(console.error)
        .finally(() => { if (first) first = false; setRefreshing(false) })
    }
    fetchGlobal()
    const iv = setInterval(fetchGlobal, 15000)
    return () => clearInterval(iv)
  }, [])

  useEffect(() => {
    setLoading(true)
    const fetcher = scope === 'all' ? adminApi.dashboard() : adminApi.eventDashboard(scope)
    fetcher
      .then(res => {
        if (scope === 'all') { setAllDashboard(res); setEventDashboard(null) }
        else { setEventDashboard(res); setAllDashboard(null) }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [scope])

  useEffect(() => {
    if (scope === 'all') { setSeatStats([]); return }
    const fetchSeats = () => adminApi.stats.seats(scope).then(setSeatStats).catch(console.error)
    fetchSeats()
    const iv = setInterval(fetchSeats, 15000)
    return () => clearInterval(iv)
  }, [scope])

  const bg = isDark ? 'bg-slate-950' : 'bg-[#f4f5f9]'
  const text = isDark ? 'text-slate-50' : 'text-slate-900'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const subtle = isDark ? 'text-slate-500' : 'text-slate-400'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'

  if (loading && !allDashboard && !eventDashboard) {
    return (
      <div className={`min-h-screen ${bg} ${text}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-center py-20">
          <div className={`flex items-center gap-3 text-sm ${muted}`}>
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
            Đang tải dashboard...
          </div>
        </div>
      </div>
    )
  }

  const isEventScope = scope !== 'all'
  const currentEvent = isEventScope ? eventDashboard : null
  const title = isEventScope ? (currentEvent?.title || '') : 'Tổng quan hệ thống'
  const subtitle = isEventScope
    ? (currentEvent?.venue_name || 'Chi tiết sự kiện')
    : `${events.length} sự kiện trong hệ thống`

  const statusInfo = {
    on_sale: { label: 'Đang mở bán', bg: 'bg-emerald-500/20', text: 'text-emerald-300', ring: 'ring-emerald-400/50' },
    sold_out: { label: 'Hết vé', bg: 'bg-rose-500/20', text: 'text-rose-300', ring: 'ring-rose-400/50' },
    finished: { label: 'Đã kết thúc', bg: 'bg-slate-500/20', text: 'text-slate-300', ring: 'ring-slate-400/50' },
    cancelled: { label: 'Đã hủy', bg: 'bg-orange-500/20', text: 'text-orange-300', ring: 'ring-orange-400/50' },
    draft: { label: 'Nháp', bg: 'bg-slate-500/20', text: 'text-slate-300', ring: 'ring-slate-400/50' },
  }[currentEvent?.status] || { label: currentEvent?.status, bg: 'bg-slate-500/20', text: 'text-slate-300', ring: 'ring-slate-400/50' }

  return (
    <>
      <style>{CSS}</style>
      <div className={`min-h-screen ${bg} ${text}`}>

        {/* ════════════ HERO HEADER ════════════ */}
        <div className="relative">
          <div className={`absolute inset-0 overflow-hidden ${isEventScope && currentEvent?.banner_url ? 'min-h-[340px]' : ''}`}>
            <div className="adm-ai-bg absolute inset-0 opacity-[0.08]" />
            {isEventScope && currentEvent?.banner_url && (
              <div className="adm-fade-in absolute inset-0">
                <img src={currentEvent.banner_url} alt="" className="adm-hero-zoom h-full w-full object-cover" key={currentEvent.event_id} />
                <div className={`absolute inset-0 ${isDark
                  ? 'bg-gradient-to-b from-slate-950/60 via-slate-950/70 to-slate-950'
                  : 'bg-gradient-to-b from-white/40 via-white/60 to-[#f4f5f9]'
                  }`} />
              </div>
            )}
          </div>

          <div className={`relative mx-auto max-w-7xl px-6 py-8 md:px-8 ${isEventScope && currentEvent?.banner_url ? 'min-h-[340px]' : ''}`}>
            <div className="adm-fade-up flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* ── Dashboard icon nâng cấp ── */}
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-lg ${isEventScope
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/30'
                  : 'bg-gradient-to-br from-sky-500 to-indigo-500 shadow-sky-500/30'
                  } text-white`}>
                  {Icon.dashboard}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-bold uppercase tracking-[0.25em] ${isEventScope ? 'text-indigo-400' : 'text-sky-500'}`}>
                    Admin · Dashboard {isEventScope && '· Sự kiện'}
                  </p>
                  <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl lg:text-4xl"
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                    {title}
                  </h1>
                  <p className={`mt-0.5 text-sm ${muted}`}>{subtitle}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {refreshing && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${isDark ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    Đang đồng bộ
                  </span>
                )}

                {/* ── Nút quản lý sự kiện có icon ── */}
                <Link
                  to="/admin/events"
                  className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${isEventScope
                    ? 'border-white/20 bg-white/10 text-white backdrop-blur-md hover:bg-white/20'
                    : (isDark ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 bg-white hover:bg-slate-50')
                    }`}
                >
                  {Icon.manageEvents}
                  Quản lý sự kiện
                </Link>

                <Link to="/admin/events/create" className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:opacity-90 hover:-translate-y-0.5">
                  + Tạo sự kiện
                </Link>
              </div>
            </div>

            <div className="adm-fade-up adm-d-100 relative mt-6 z-50">
              <ScopeSelector scope={scope} events={events} onChange={setScope} isDark={isDark} />
            </div>
          </div>
        </div>

        <section className="mx-auto max-w-7xl px-6 pb-12 md:px-8">

          {/* ═══════════════ VIEW 1: TOÀN BỘ HỆ THỐNG ═══════════════ */}
          {!isEventScope && allDashboard && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Doanh thu" value={fmtVND(allDashboard.total_revenue)} icon={Icon.cash} color="emerald"
                  sparkData={allDashboard.recent_revenue?.map(r => r.revenue) || []} isDark={isDark} delay={0} />
                <KpiCard label="Vé đã bán" value={fmtNum(allDashboard.total_tickets_sold)} icon={Icon.ticket} color="sky"
                  sparkData={allDashboard.recent_revenue?.map(r => r.tickets_sold) || []} isDark={isDark} delay={50} />
                <KpiCard label="Tổng sự kiện" value={fmtNum(allDashboard.total_events)} icon={Icon.calendar} color="indigo"
                  hint={`${allDashboard.active_events} đang mở bán`} isDark={isDark} delay={100} />
                <KpiCard label="Đang mở bán" value={fmtNum(allDashboard.active_events)} icon={Icon.pulse} color="violet"
                  hint={`${((allDashboard.active_events / Math.max(allDashboard.total_events, 1)) * 100).toFixed(0)}% danh mục`} isDark={isDark} delay={150} />
              </div>

              <div className="mt-6">
                <AiInsightsCard scope="all" eventId={null} isDark={isDark} />
              </div>

              <div className={`adm-fade-up adm-d-300 mt-6 rounded-3xl border p-6 ${card}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>{Icon.trend}</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Doanh thu</p>
                      <h2 className="text-base font-bold">7 ngày gần nhất</h2>
                    </div>
                  </div>
                  <div className={`text-xs ${muted}`}>
                    Tổng: <span className={`font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {fmtVND(allDashboard.recent_revenue?.reduce((s, r) => s + r.revenue, 0) || 0)}
                    </span>
                  </div>
                </div>
                {allDashboard.recent_revenue?.length
                  ? <RevenueAreaChart data={allDashboard.recent_revenue} isDark={isDark} />
                  : <p className={`mt-6 text-center text-sm ${muted}`}>Chưa có dữ liệu doanh thu.</p>
                }
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className={`adm-fade-up adm-d-400 rounded-3xl border p-6 ${card}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>{Icon.users}</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Khán giả</p>
                      <h2 className="text-base font-bold">Phân bổ giới tính & độ tuổi</h2>
                    </div>
                  </div>
                  {audience ? (
                    <div className="mt-4 grid gap-6 md:grid-cols-2">
                      <div>
                        <p className={`mb-2 text-xs font-semibold ${subtle}`}>Giới tính</p>
                        <DonutChart slices={[
                          { label: 'Nam', value: audience.gender_male || 0, color: '#0ea5e9' },
                          { label: 'Nữ', value: audience.gender_female || 0, color: '#ec4899' },
                          { label: 'Khác', value: audience.gender_other || 0, color: '#a78bfa' },
                        ]} isDark={isDark} centerLabel="người" />
                      </div>
                      <div>
                        <p className={`mb-2 text-xs font-semibold ${subtle}`}>Độ tuổi</p>
                        <BarChart bars={[
                          { label: '<18', value: audience.age_under_18 || 0 },
                          { label: '18-25', value: audience.age_18_25 || 0 },
                          { label: '26-35', value: audience.age_26_35 || 0 },
                          { label: '36-45', value: audience.age_36_45 || 0 },
                          { label: '45+', value: audience.age_above_45 || 0 },
                        ]} isDark={isDark} />
                      </div>
                    </div>
                  ) : <p className={`mt-4 text-sm ${muted}`}>Chưa có dữ liệu.</p>}
                </div>

                <div className={`adm-fade-up adm-d-500 rounded-3xl border p-6 ${card}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-amber-500/15 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>🏆</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Bảng xếp hạng</p>
                      <h2 className="text-base font-bold">Top sự kiện có doanh thu cao</h2>
                    </div>
                  </div>
                  <TopEventsList events={events} isDark={isDark} />
                </div>
              </div>
            </>
          )}

          {/* ═══════════════ VIEW 2: 1 SỰ KIỆN ═══════════════ */}
          {isEventScope && eventDashboard && (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickInfoCard icon={Icon.status} label="Trạng thái" value={statusInfo.label}
                  accent={eventDashboard.status === 'on_sale' ? (isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                    : eventDashboard.status === 'sold_out' ? (isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600')
                      : (isDark ? 'bg-slate-500/15 text-slate-400' : 'bg-slate-100 text-slate-600')}
                  isDark={isDark} delay={0} />
                <QuickInfoCard icon={Icon.calendar} label="Ngày diễn ra"
                  value={eventDashboard.event_date ? new Date(eventDashboard.event_date).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Chưa xác định'}
                  accent={isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'} isDark={isDark} delay={50} />
                <QuickInfoCard icon={Icon.pin} label="Địa điểm" value={eventDashboard.venue_name || 'Chưa xác định'}
                  accent={isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} isDark={isDark} delay={100} />
                <QuickInfoCard icon={Icon.layout} label="Quy mô"
                  value={`${eventDashboard.sections_count} khu · ${fmtNum(eventDashboard.total_seats)} ghế`}
                  accent={isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600'} isDark={isDark} delay={150} />
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard label="Doanh thu" value={fmtVND(eventDashboard.revenue)} icon={Icon.cash} color="emerald"
                  sparkData={eventDashboard.recent_revenue?.map(r => r.revenue) || []} isDark={isDark} delay={0} />
                <KpiCard label="Vé đã bán" value={fmtNum(eventDashboard.tickets_sold)} icon={Icon.ticket} color="sky"
                  sparkData={eventDashboard.recent_revenue?.map(r => r.tickets_sold) || []} isDark={isDark} delay={50} />
                <KpiCard label="Tỷ lệ lấp đầy" value={`${eventDashboard.fill_pct}%`} icon={Icon.seat}
                  color={eventDashboard.fill_pct > 80 ? 'rose' : eventDashboard.fill_pct > 50 ? 'amber' : 'emerald'}
                  hint={`${fmtNum(eventDashboard.sold_seats)}/${fmtNum(eventDashboard.total_seats)} ghế`} isDark={isDark} delay={100} />
                <KpiCard label="Giá vé TB" value={fmtVND(Math.round(eventDashboard.avg_ticket_price))} icon={Icon.users} color="violet" isDark={isDark} delay={150} />
              </div>

              <div className="mt-6">
                <AiInsightsCard scope={scope} eventId={scope} isDark={isDark} />
              </div>

              <div className={`adm-fade-up adm-d-300 mt-6 rounded-3xl border p-6 ${card}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>{Icon.trend}</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Doanh thu sự kiện</p>
                      <h2 className="text-base font-bold">7 ngày gần nhất</h2>
                    </div>
                  </div>
                  <div className={`text-xs ${muted}`}>
                    Tổng: <span className={`font-extrabold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {fmtVND(eventDashboard.recent_revenue?.reduce((s, r) => s + r.revenue, 0) || 0)}
                    </span>
                  </div>
                </div>
                {eventDashboard.recent_revenue?.length
                  ? <RevenueAreaChart data={eventDashboard.recent_revenue} isDark={isDark} />
                  : <p className={`mt-6 text-center text-sm ${muted}`}>Chưa có dữ liệu doanh thu.</p>
                }
              </div>

              {eventDashboard.audience && (
                <div className={`adm-fade-up adm-d-350 mt-6 rounded-3xl border p-6 ${card}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-violet-500/15 text-violet-400' : 'bg-violet-50 text-violet-600'}`}>{Icon.users}</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Khán giả sự kiện</p>
                      <h2 className="text-base font-bold">Phân bổ giới tính & độ tuổi</h2>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div>
                      <p className={`mb-2 text-xs font-semibold ${subtle}`}>Giới tính</p>
                      <DonutChart slices={[
                        { label: 'Nam', value: eventDashboard.audience.gender_male || 0, color: '#0ea5e9' },
                        { label: 'Nữ', value: eventDashboard.audience.gender_female || 0, color: '#ec4899' },
                        { label: 'Khác', value: eventDashboard.audience.gender_other || 0, color: '#a78bfa' },
                      ]} isDark={isDark} centerLabel="người" />
                    </div>
                    <div>
                      <p className={`mb-2 text-xs font-semibold ${subtle}`}>Độ tuổi</p>
                      <BarChart bars={[
                        { label: '<18', value: eventDashboard.audience.age_under_18 || 0 },
                        { label: '18-25', value: eventDashboard.audience.age_18_25 || 0 },
                        { label: '26-35', value: eventDashboard.audience.age_26_35 || 0 },
                        { label: '36-45', value: eventDashboard.audience.age_36_45 || 0 },
                        { label: '45+', value: eventDashboard.audience.age_above_45 || 0 },
                      ]} isDark={isDark} />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                <div className={`adm-fade-up adm-d-400 rounded-3xl border p-6 ${card}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-rose-500/15 text-rose-400' : 'bg-rose-50 text-rose-600'}`}>{Icon.seat}</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Ghế</p>
                      <h2 className="text-base font-bold">Tình trạng tổng thể</h2>
                    </div>
                  </div>
                  <DonutChart slices={[
                    { label: 'Đã bán', value: eventDashboard.sold_seats, color: '#f43f5e' },
                    { label: 'Đang giữ', value: eventDashboard.locked_seats, color: '#f59e0b' },
                    { label: 'Còn trống', value: eventDashboard.available_seats, color: '#10b981' },
                  ]} isDark={isDark} centerLabel="ghế" />
                </div>

                <div className={`adm-fade-up adm-d-500 rounded-3xl border p-6 ${card}`}>
                  <div className="mb-3 flex items-center gap-2.5">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isDark ? 'bg-indigo-500/15 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>{Icon.pulse}</div>
                    <div>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Khu vực</p>
                      <h2 className="text-base font-bold">Lấp đầy theo khu vực</h2>
                    </div>
                  </div>
                  {seatStats.length === 0 ? (
                    <p className={`mt-4 text-sm ${muted}`}>Chưa có dữ liệu khu vực.</p>
                  ) : (
                    <div className="space-y-3.5">
                      {seatStats.map((sec, i) => (
                        <div key={sec.section_name} className="adm-fade-up" style={{ animationDelay: `${i * 80}ms` }}>
                          <div className="mb-1.5 flex items-center justify-between text-sm">
                            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{sec.section_name}</span>
                            <span className={`text-xs tabular-nums ${muted}`}>
                              {sec.sold}/{sec.total} · <span className={`font-bold ${sec.fill_pct > 80 ? 'text-rose-400' : sec.fill_pct > 50 ? 'text-amber-500' : isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{sec.fill_pct}%</span>
                            </span>
                          </div>
                          <div className={`flex h-3 overflow-hidden rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div className="h-full bg-rose-400 transition-all duration-700" style={{ width: `${(sec.sold / sec.total) * 100}%` }} />
                            <div className="h-full bg-amber-400 transition-all duration-700" style={{ width: `${(sec.locked / sec.total) * 100}%` }} />
                            <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${(sec.available / sec.total) * 100}%` }} />
                          </div>
                        </div>
                      ))}
                      <div className={`flex flex-wrap gap-3 pt-2 text-[11px] ${muted}`}>
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-rose-400" />Đã bán</span>
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-amber-400" />Đang giữ</span>
                        <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-400" />Còn trống</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

        </section>
      </div>
    </>
  )
}

export default AdminDashboard