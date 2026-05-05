import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { adminApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// ─── Animations ───────────────────────────────────────────────────────────────
const CSS = `
@keyframes acFadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes acFadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes acSlideRight {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes acSlideLeft {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes acScaleIn {
  from { opacity: 0; transform: scale(0.93); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes acShimmer {
  0%, 100% { background-position: 0% 50%; }
  50%      { background-position: 100% 50%; }
}
@keyframes acPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(0.95); }
}
@keyframes acCheckPop {
  0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
  70%  { transform: scale(1.2) rotate(5deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes acProgressFill {
  from { width: 0%; }
  to   { width: var(--target-width); }
}
@keyframes acRipple {
  0%   { transform: scale(0); opacity: 0.4; }
  100% { transform: scale(4); opacity: 0; }
}
@keyframes acFloat {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-6px); }
}

.ac-fade-up    { animation: acFadeUp 0.55s cubic-bezier(.22,1,.36,1) both; }
.ac-fade-in    { animation: acFadeIn 0.4s ease both; }
.ac-slide-r    { animation: acSlideRight 0.45s cubic-bezier(.22,1,.36,1) both; }
.ac-slide-l    { animation: acSlideLeft 0.45s cubic-bezier(.22,1,.36,1) both; }
.ac-scale-in   { animation: acScaleIn 0.4s cubic-bezier(.22,1,.36,1) both; }
.ac-check-pop  { animation: acCheckPop 0.5s cubic-bezier(.34,1.56,.64,1) both; }
.ac-float      { animation: acFloat 3s ease-in-out infinite; }

.ac-d-50  { animation-delay: 0.05s; }
.ac-d-100 { animation-delay: 0.1s; }
.ac-d-150 { animation-delay: 0.15s; }
.ac-d-200 { animation-delay: 0.2s; }
.ac-d-250 { animation-delay: 0.25s; }
.ac-d-300 { animation-delay: 0.3s; }
.ac-d-350 { animation-delay: 0.35s; }
.ac-d-400 { animation-delay: 0.4s; }

.ac-hero-gradient {
  background: linear-gradient(135deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: acShimmer 12s ease infinite;
}

.ac-input-focus {
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.ac-input-focus:focus {
  border-color: rgba(99,102,241,0.6);
  box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
}

.ac-btn-ripple {
  position: relative;
  overflow: hidden;
}
.ac-btn-ripple::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.15);
  transform: scale(0);
  border-radius: inherit;
  transition: transform 0.4s, opacity 0.4s;
  opacity: 0;
}
.ac-btn-ripple:active::after {
  transform: scale(1);
  opacity: 1;
  transition: none;
}

.step-enter { animation: acSlideLeft 0.4s cubic-bezier(.22,1,.36,1) both; }
.step-exit  { animation: acSlideRight 0.3s cubic-bezier(.22,1,.36,1) reverse both; }
`

const emptyForm = {
  title: '', artist: '', venue_name: '', venue_address: '',
  event_date: '', sale_start: '', sale_end: '',
  banner_url: '', queue_enabled: false, description: '', sections: [],
}

const emptySection = { name: '', rows: 10, cols: 10, price: 500000, color: '#6366f1' }

const PRESET_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#0ea5e9', '#a855f7', '#ec4899', '#14b8a6']

// ─── Icons ────────────────────────────────────────────────────────────────────
const I = {
  info: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="8" cy="8" r="6.5" /><path d="M8 7v4M8 5.5v.01" strokeLinecap="round" /></svg>,
  seat: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2M2 10h12M5 10v3M11 10v3" /></svg>,
  confirm: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M13 5L6.5 11.5 3 8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="m2 7 3 3 7-7" /></svg>,
  plus: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 2v10M2 7h10" /></svg>,
  trash: <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M1.5 3.5h11M5 3.5V2.5h4v1M3.5 3.5l.5 8a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1l.5-8" /></svg>,
  back: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 2L4 7l5 5" /></svg>,
  arrow: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M2 7h10M8 3l4 4-4 4" /></svg>,
  cal: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M5 2v2M11 2v2M2 7h12" /></svg>,
  pin: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 9.5A2.5 2.5 0 1 0 8 4.5a2.5 2.5 0 0 0 0 5Z" /><path d="M8 2C5.24 2 3 4.24 3 7c0 3.75 5 8 5 8s5-4.25 5-8c0-2.76-2.24-5-5-5Z" /></svg>,
  user: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" /></svg>,
  image: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="2" width="12" height="12" rx="2" /><circle cx="5.5" cy="5.5" r="1" /><path d="M2 10.5l3.5-3.5 2.5 2.5 1.5-1.5 3 3" /></svg>,
  queue: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><path d="M8 5v3l2 2" strokeLinecap="round" /></svg>,
  ticket: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" /><path d="M7 3v10" strokeDasharray="2 2" /></svg>,
  grid: <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" /><rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" /></svg>,
  cash: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="8" cy="8" r="6.5" /><path d="M8 4.5v1M8 10.5v1M5.5 7h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2H10" strokeLinecap="round" /></svg>,
  alert: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="8" cy="8" r="6.5" /><path d="M8 5v3.5M8 11h.01" strokeLinecap="round" /></svg>,
  sparkle: <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l1.5 4.5L14 7l-4.5 1.5L8 13l-1.5-4.5L2 7l4.5-1.5z" /></svg>,
}

const STEPS = [
  { id: 1, label: 'Thông tin', icon: I.info, desc: 'Tên, địa điểm, thời gian' },
  { id: 2, label: 'Khu vực ghế', icon: I.seat, desc: 'Cấu hình sơ đồ chỗ ngồi' },
  { id: 3, label: 'Xác nhận', icon: I.confirm, desc: 'Xem lại và tạo sự kiện' },
]

// ─── Input Field ──────────────────────────────────────────────────────────────
function Field({ label, icon, children, hint }) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
        {icon && <span className="text-indigo-400">{icon}</span>}
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500">{hint}</p>}
    </div>
  )
}

// ─── Step Indicator ───────────────────────────────────────────────────────────
function StepBar({ current, isDark }) {
  return (
    <div className="relative flex items-center justify-between">
      {/* connector line */}
      <div className={`absolute left-0 right-0 top-5 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`} />
      <div
        className="absolute left-0 top-5 h-px bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-700"
        style={{ width: `${((current - 1) / (STEPS.length - 1)) * 100}%` }}
      />

      {STEPS.map((step) => {
        const done = current > step.id
        const active = current === step.id

        return (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${done
              ? 'border-indigo-500 bg-indigo-500 text-white'
              : active
                ? isDark ? 'border-sky-400 bg-sky-400/15 text-sky-400' : 'border-sky-500 bg-sky-50 text-sky-600'
                : isDark ? 'border-slate-700 bg-slate-900 text-slate-600' : 'border-slate-200 bg-white text-slate-400'
              }`}>
              {done
                ? <span className="ac-check-pop">{I.check}</span>
                : <span className={active ? '' : ''}>{step.icon}</span>
              }
            </div>
            <div className="text-center">
              <p className={`text-xs font-bold ${active ? (isDark ? 'text-sky-400' : 'text-sky-600') : done ? (isDark ? 'text-indigo-400' : 'text-indigo-600') : (isDark ? 'text-slate-600' : 'text-slate-400')}`}>
                {step.label}
              </p>
              <p className={`hidden text-[10px] sm:block ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>{step.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function SectionCard({ sec, onRemove, isDark }) {
  const total = sec.rows * sec.cols
  return (
    <div className={`ac-scale-in group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${isDark ? 'border-slate-700/80 bg-slate-800/60 hover:shadow-black/30' : 'border-slate-200 bg-white hover:shadow-slate-200/60'
      }`}>
      {/* left color accent */}
      <div className="absolute left-0 top-0 h-full w-1 rounded-l-2xl" style={{ backgroundColor: sec.color }} />
      <div className="pl-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold" style={{ color: sec.color }}>{sec.name}</p>
            <div className={`mt-1 flex flex-wrap gap-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              <span className="flex items-center gap-1">{I.grid} {sec.rows}×{sec.cols}</span>
              <span className="flex items-center gap-1">{I.seat} {total} ghế</span>
              <span className="flex items-center gap-1">{I.cash} {Number(sec.price).toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onRemove(sec._tempId)}
            className={`rounded-lg p-1.5 opacity-0 transition group-hover:opacity-100 ${isDark ? 'text-slate-500 hover:bg-rose-500/15 hover:text-rose-400' : 'text-slate-400 hover:bg-rose-50 hover:text-rose-500'}`}
          >
            {I.trash}
          </button>
        </div>
        {/* seat fill bar */}
        <div className={`mt-2.5 h-1.5 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <div className="h-full w-full rounded-full" style={{ backgroundColor: sec.color, opacity: 0.6 }} />
        </div>
      </div>
    </div>
  )
}

// ─── Review Row ───────────────────────────────────────────────────────────────
function ReviewRow({ label, value, icon, isDark, accent }) {
  if (!value) return null
  return (
    <div className={`flex items-start gap-3 border-b py-3 last:border-0 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
      <span className={`mt-0.5 shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`text-[11px] font-bold uppercase tracking-[0.12em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</p>
        <p className={`mt-0.5 text-sm ${accent ? (isDark ? 'text-indigo-400 font-semibold' : 'text-indigo-600 font-semibold') : (isDark ? 'text-slate-200' : 'text-slate-800')}`}>{value}</p>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function AdminCreateEvent() {
  const navigate = useNavigate()
  const { user, authLoading } = useAuth()
  const { isDark } = useTheme()

  const location = useLocation()
  const editEvent = location.state?.editEvent ?? null
  const isEditing = Boolean(editEvent)

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState('forward')

  const [form, setForm] = useState(() => {
    if (!editEvent) return emptyForm
    return {
      title: editEvent.title ?? '',
      artist: editEvent.artist ?? '',
      venue_name: editEvent.venue_name ?? '',
      venue_address: editEvent.venue_address ?? '',
      event_date: editEvent.event_date?.slice(0, 16) ?? '',
      sale_start: editEvent.sale_start?.slice(0, 16) ?? '',
      sale_end: editEvent.sale_end?.slice(0, 16) ?? '',
      banner_url: editEvent.banner_url ?? '',
      queue_enabled: Boolean(editEvent.queue_enabled),
      description: editEvent.description ?? '',
      sections: [],   // sections cần load riêng nếu API trả về
    }
  })

  const [sectionDraft, setSectionDraft] = useState(emptySection)
  const [bannerOk, setBannerOk] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') navigate('/', { replace: true })
  }, [user, authLoading, navigate])

  useEffect(() => { setBannerOk(false) }, [form.banner_url])

  const goTo = (n) => {
    setDirection(n > step ? 'forward' : 'back')
    setError('')
    setStep(n)
  }

  const validateStep1 = () => {
    if (!form.title.trim()) { setError('Vui lòng nhập tên sự kiện.'); return false }
    if (!form.venue_name.trim()) { setError('Vui lòng nhập tên địa điểm.'); return false }
    if (!form.event_date) { setError('Vui lòng chọn ngày diễn ra.'); return false }
    return true
  }

  const validateStep2 = () => {
    if (!form.sections.length) { setError('Thêm ít nhất một khu vực ghế.'); return false }
    return true
  }

  const handleNext = () => {
    setError('')
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    goTo(step + 1)
  }

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSectionChange = (e) => {
    const { name, value } = e.target
    setSectionDraft(p => ({ ...p, [name]: name === 'name' || name === 'color' ? value : Number(value) }))
  }

  const addSection = () => {
    if (!sectionDraft.name.trim()) return
    setForm(p => ({
      ...p,
      sections: [...p.sections, { ...sectionDraft, _tempId: Date.now(), name: sectionDraft.name.trim() }]
    }))
    setSectionDraft(emptySection)
  }

  const removeSection = (id) => setForm(p => ({ ...p, sections: p.sections.filter(s => s._tempId !== id) }))

  const handleSubmit = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        artist: form.artist.trim() || undefined,
        venue_name: form.venue_name.trim(),
        venue_address: form.venue_address.trim() || undefined,
        event_date: form.event_date || undefined,
        sale_start: form.sale_start || undefined,
        sale_end: form.sale_end || undefined,
        banner_url: form.banner_url.trim() || undefined,
        queue_enabled: form.queue_enabled,
        description: form.description.trim() || undefined,
      }

      if (isEditing) {
        // Chỉ update metadata, không đụng sections
        await adminApi.events.update(editEvent.id, payload)
      } else {
        // Tạo mới + tạo sections
        const newEvent = await adminApi.events.create(payload)
        await Promise.all(form.sections.map(sec =>
          adminApi.events.createSection(newEvent.id, {
            name: sec.name, rows: sec.rows, cols: sec.cols,
            price: sec.price, color: sec.color,
          })
        ))
      }
      setDone(true)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  // ── styles ──
  const bg = isDark ? 'bg-slate-950 text-slate-50' : 'bg-[#f4f5f9] text-slate-900'
  const card = isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
  const inputC = isDark
    ? 'w-full rounded-xl border border-slate-700 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white outline-none placeholder-slate-500 ac-input-focus'
    : 'w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-900 outline-none placeholder-slate-400 ac-input-focus'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'

  const totalSeats = form.sections.reduce((s, sec) => s + sec.rows * sec.cols, 0)

  // ── Success screen ──
  if (done) {
    return (
      <>
        <style>{CSS}</style>
        <div className={`flex min-h-screen items-center justify-center ${bg}`}>
          <div className="ac-scale-in flex flex-col items-center gap-6 text-center px-6">
            <div className="relative">
              <div className="ac-float flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-400 to-sky-500 text-white shadow-2xl shadow-emerald-500/30">
                <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 22l9 9 19-19" />
                </svg>
              </div>
            </div>
            <div>
              <h2 className={`text-3xl font-extrabold ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>{isEditing ? 'Sự kiện đã được cập nhật!' : 'Sự kiện đã được tạo!'}</h2>
              <p className={`mt-2 text-sm ${muted}`}>"{form.title}" {isEditing ? 'đã được lưu thành công.' : 'đang sẵn sàng để quản lý.'}</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setDone(false); setForm(emptyForm); setStep(1) }}
                className={`rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
                Tạo sự kiện khác
              </button>
              <button onClick={() => navigate('/admin/events')}
                className="ac-btn-ripple rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/25 transition hover:-translate-y-0.5">
                Quản lý sự kiện
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className={`min-h-screen ${bg}`}>

        {/* ── Hero header ── */}
        <div className="relative overflow-hidden">
          <div className="ac-hero-gradient absolute inset-0 opacity-[0.09]" />
          <div className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(99,102,241,0.15) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(14,165,233,0.12) 0%, transparent 50%)',
            }} />
          <div className="relative mx-auto max-w-6xl px-6 py-8 md:px-8">
            <div className="ac-fade-up mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white shadow-lg shadow-sky-500/30">
                  {I.ticket}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    Admin · {isEditing ? 'Chỉnh sửa' : 'Tạo mới'}
                  </p>
                  <h1 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                    {isEditing ? <>Chỉnh sửa thông tin sự kiện</> : <>Tạo sự kiện</>}
                  </h1>
                </div>
              </div>
              <Link to="/admin/events"
                className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${isDark ? 'border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>
                {I.back} Quay lại
              </Link>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div className="mx-auto max-w-6xl px-6 pb-16 md:px-8">

          {/* Step bar */}
          <div className={`ac-fade-up ac-d-100 mt-8 mb-8 rounded-2xl border p-6 ${card}`}>
            <StepBar current={step} isDark={isDark} />
          </div>

          {/* Error */}
          {error && (
            <div className={`ac-slide-r mb-5 flex items-center gap-2.5 rounded-2xl border p-4 text-sm ${isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-300' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
              {I.alert} {error}
            </div>
          )}

          {/* ══ STEP 1: Info ══ */}
          {step === 1 && (
            <div className="ac-slide-l space-y-5">

              {/* Banner preview card */}
              {form.banner_url && (
                <div className={`ac-scale-in overflow-hidden rounded-2xl border ${card}`}>
                  <div className="relative h-40 bg-slate-800">
                    <img
                      src={form.banner_url}
                      alt="banner"
                      className="h-full w-full object-cover"
                      onLoad={() => setBannerOk(true)}
                      onError={() => setBannerOk(false)}
                    />
                    {!bannerOk && (
                      <div className={`absolute inset-0 flex items-center justify-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Không tải được ảnh
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {bannerOk && form.title && (
                      <p className="absolute bottom-3 left-4 text-lg font-extrabold text-white drop-shadow-lg">{form.title}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Event info card */}
              <div className={`rounded-2xl border p-6 ${card}`}>
                <h2 className={`mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {I.sparkle} <span>Thông tin sự kiện</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field label="Tên sự kiện" icon={I.ticket}>
                      <input name="title" value={form.title} onChange={handleChange} placeholder="VD: Concert Sơn Tùng MTP 2026" className={inputC} />
                    </Field>
                  </div>
                  <Field label="Nghệ sĩ / Ban nhạc" icon={I.user}>
                    <input name="artist" value={form.artist} onChange={handleChange} placeholder="VD: Sơn Tùng MTP" className={inputC} />
                  </Field>
                  <Field label="URL Banner" icon={I.image}>
                    <input name="banner_url" value={form.banner_url} onChange={handleChange} placeholder="https://..." className={inputC} />
                  </Field>
                  <Field label="Tên địa điểm" icon={I.pin}>
                    <input name="venue_name" value={form.venue_name} onChange={handleChange} placeholder="VD: SVĐ Mỹ Đình" className={inputC} />
                  </Field>
                  <Field label="Địa chỉ" icon={I.pin}>
                    <input name="venue_address" value={form.venue_address} onChange={handleChange} placeholder="VD: Hà Nội" className={inputC} />
                  </Field>
                </div>
              </div>

              {/* Schedule card */}
              <div className={`rounded-2xl border p-6 ${card}`}>
                <h2 className={`mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {I.cal} <span>Lịch trình</span>
                </h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <Field label="Ngày diễn ra *" icon={I.cal}>
                    <input type="datetime-local" name="event_date" value={form.event_date} onChange={handleChange} className={inputC} />
                  </Field>
                  <Field label="Bắt đầu mở bán" icon={I.cal}>
                    <input type="datetime-local" name="sale_start" value={form.sale_start} onChange={handleChange} className={inputC} />
                  </Field>
                  <Field label="Kết thúc mở bán" icon={I.cal}>
                    <input type="datetime-local" name="sale_end" value={form.sale_end} onChange={handleChange} className={inputC} />
                  </Field>
                </div>
              </div>

              {/* Description + queue card */}
              <div className={`rounded-2xl border p-6 ${card}`}>
                <h2 className={`mb-5 flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                  {I.info} <span>Bổ sung</span>
                </h2>
                <div className="space-y-4">
                  <Field label="Mô tả sự kiện">
                    <textarea name="description" rows={3} value={form.description} onChange={handleChange}
                      placeholder="Giới thiệu ngắn về sự kiện..." className={`${inputC} resize-none`} />
                  </Field>
                  <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${form.queue_enabled
                    ? isDark ? 'border-amber-500/30 bg-amber-500/8 text-amber-300' : 'border-amber-300 bg-amber-50 text-amber-700'
                    : isDark ? 'border-slate-700 bg-slate-800/40 hover:bg-slate-800' : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/60'
                    }`}>
                    <input type="checkbox" name="queue_enabled" checked={form.queue_enabled} onChange={handleChange} className="h-4 w-4 rounded accent-amber-400" />
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-amber-400">{I.queue}</span>
                      <span>
                        <span className="font-semibold">Bật phòng chờ ảo</span>
                        <span className={`ml-2 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>cho sự kiện có nhu cầu mua đột biến</span>
                      </span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 2: Seat config ══ */}
          {step === 2 && (
            <div className="ac-slide-l space-y-5">

              {/* Section builder */}
              <div className={`rounded-2xl border p-6 ${card}`}>
                <div className="mb-5 flex items-center justify-between">
                  <h2 className={`flex items-center gap-2 text-sm font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>
                    {I.plus} <span>Thêm khu vực</span>
                  </h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${isDark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>
                    {form.sections.length} khu vực · {totalSeats.toLocaleString('vi-VN')} ghế
                  </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Field label="Tên khu vực" icon={I.seat}>
                      <input name="name" value={sectionDraft.name} onChange={handleSectionChange} placeholder="VD: VIP, Sân khấu, GA..." className={inputC} />
                    </Field>
                  </div>
                  <Field label="Số hàng" icon={I.grid}>
                    <input type="number" name="rows" min={1} max={50} value={sectionDraft.rows} onChange={handleSectionChange} className={inputC} />
                  </Field>
                  <Field label="Số cột" icon={I.grid}>
                    <input type="number" name="cols" min={1} max={50} value={sectionDraft.cols} onChange={handleSectionChange} className={inputC} />
                  </Field>
                  <Field label={`Giá vé · ${Number(sectionDraft.price).toLocaleString('vi-VN')} ₫`} icon={I.cash}>
                    <input type="number" name="price" min={0} step={50000} value={sectionDraft.price} onChange={handleSectionChange} className={inputC} />
                  </Field>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Field label="Màu sắc">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {PRESET_COLORS.map(c => (
                            <button key={c} type="button" onClick={() => setSectionDraft(p => ({ ...p, color: c }))}
                              className="h-7 w-7 rounded-lg border-2 transition-transform hover:scale-110"
                              style={{ backgroundColor: c, borderColor: sectionDraft.color === c ? 'white' : 'transparent' }} />
                          ))}
                        </div>
                        <input type="color" name="color" value={sectionDraft.color} onChange={handleSectionChange}
                          className="h-7 w-7 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
                      </div>
                    </Field>
                  </div>
                </div>

                {/* Preview of section */}
                <div className={`mt-4 flex items-center justify-between rounded-xl border px-4 py-3 ${isDark ? 'border-slate-700/60 bg-slate-800/40' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span className="font-bold" style={{ color: sectionDraft.color }}>{sectionDraft.name || 'Tên khu vực'}</span>
                    {' · '}{sectionDraft.rows}×{sectionDraft.cols} = <strong>{sectionDraft.rows * sectionDraft.cols} ghế</strong>
                    {' · '}{Number(sectionDraft.price).toLocaleString('vi-VN')} ₫/ghế
                  </div>
                  <button type="button" onClick={addSection}
                    disabled={!sectionDraft.name.trim()}
                    className="ac-btn-ripple flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-500/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40">
                    {I.plus} Thêm khu vực
                  </button>
                </div>
              </div>

              {/* Sections list */}
              {form.sections.length === 0 ? (
                <div className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 ${isDark ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${isDark ? 'bg-slate-800 text-slate-600' : 'bg-slate-100 text-slate-400'}`}>
                    {I.seat}
                  </div>
                  <p className={`text-sm font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Chưa có khu vực ghế</p>
                  <p className={`mt-1 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Điền form bên trên và bấm "Thêm khu vực"</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {form.sections.map(sec => (
                    <SectionCard key={sec._tempId} sec={sec} onRemove={removeSection} isDark={isDark} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ STEP 3: Review ══ */}
          {step === 3 && (
            <div className="ac-slide-l space-y-5">

              {/* Banner preview */}
              {form.banner_url && bannerOk && (
                <div className={`overflow-hidden rounded-2xl border ${card}`}>
                  <div className="relative h-48">
                    <img src={form.banner_url} alt="banner" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      <p className="text-2xl font-extrabold text-white drop-shadow-lg">{form.title}</p>
                      {form.artist && <p className="mt-1 text-sm text-white/70">{form.artist}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                {/* Event info */}
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <h3 className={`mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {I.info} Thông tin sự kiện
                  </h3>
                  <div className="mt-3">
                    <ReviewRow label="Tên sự kiện" value={form.title} icon={I.ticket} isDark={isDark} accent />
                    <ReviewRow label="Nghệ sĩ" value={form.artist} icon={I.user} isDark={isDark} />
                    <ReviewRow label="Địa điểm" value={form.venue_name} icon={I.pin} isDark={isDark} />
                    <ReviewRow label="Địa chỉ" value={form.venue_address} icon={I.pin} isDark={isDark} />
                    <ReviewRow label="Ngày diễn" value={form.event_date ? new Date(form.event_date).toLocaleString('vi-VN') : ''} icon={I.cal} isDark={isDark} />
                    {form.sale_start && <ReviewRow label="Mở bán" value={new Date(form.sale_start).toLocaleString('vi-VN')} icon={I.cal} isDark={isDark} />}
                    {form.queue_enabled && <ReviewRow label="Phòng chờ" value="Đã bật" icon={I.queue} isDark={isDark} />}
                  </div>
                </div>

                {/* Seat summary */}
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <h3 className={`mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {I.seat} Khu vực ghế · {totalSeats.toLocaleString('vi-VN')} ghế
                  </h3>
                  <div className="mt-3 space-y-2.5">
                    {form.sections.map(sec => (
                      <div key={sec._tempId} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: sec.color }} />
                          <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{sec.name}</span>
                        </div>
                        <div className={`text-right text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <span>{sec.rows * sec.cols} ghế · </span>
                          <span className="font-bold">{Number(sec.price).toLocaleString('vi-VN')} ₫</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-4 border-t pt-3 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Tổng sức chứa</span>
                      <span className={`font-extrabold tabular-nums ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        {totalSeats.toLocaleString('vi-VN')} ghế
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* description */}
              {form.description && (
                <div className={`rounded-2xl border p-5 ${card}`}>
                  <p className={`mb-2 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Mô tả</p>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{form.description}</p>
                </div>
              )}
            </div>
          )}

          {/* ── Nav buttons ── */}
          <div className={`mt-6 flex items-center justify-between rounded-2xl border p-4 ${card}`}>
            <button
              type="button"
              onClick={() => goTo(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-30 ${isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
            >
              {I.back} Bước trước
            </button>

            <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
              {STEPS.map(s => (
                <div key={s.id} className={`h-1.5 rounded-full transition-all duration-300 ${s.id === step ? 'w-6 bg-sky-500' : s.id < step ? 'w-3 bg-indigo-500' : 'w-3 bg-slate-300 dark:bg-slate-700'}`} />
              ))}
            </div>

            {step < 3 ? (
              <button type="button" onClick={handleNext}
                className="ac-btn-ripple flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-sky-500/20 transition hover:-translate-y-0.5 active:scale-[0.98]">
                Tiếp theo {I.arrow}
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={saving}
                className="ac-btn-ripple flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60">
                {saving
                  ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Đang lưu...</>
                  : isEditing
                    ? <>{I.sparkle} Lưu thay đổi</>
                    : <>{I.sparkle} Tạo sự kiện</>
                }
              </button>
            )}
          </div>
        </div>
      </div >
    </>
  )
}

export default AdminCreateEvent