import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi, ticketsApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

// ─── Styles ───────────────────────────────────────────────────────────────────
const CSS = `
@keyframes profFadeUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes profSlideIn {
  from { opacity: 0; transform: translateX(20px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes profToastIn {
  from { opacity: 0; transform: translateY(-10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes profShimmerBg {
  0%   { background-position: 0% 50%; }
  50%  { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.prof-section-1 { animation: profFadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.05s both; }
.prof-section-2 { animation: profFadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.15s both; }
.prof-section-3 { animation: profFadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.25s both; }
.prof-section-4 { animation: profFadeUp 0.6s cubic-bezier(.22,1,.36,1) 0.35s both; }

.prof-toast { animation: profToastIn 0.35s cubic-bezier(.22,1,.36,1) both; }

.prof-cover-bg {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: profShimmerBg 12s ease infinite;
}

button:not(:disabled), a, label { cursor: pointer; }
button:disabled { cursor: not-allowed; }
input[readonly] { cursor: not-allowed; }
`

// ─── Helpers ──────────────────────────────────────────────────────────────────
// Convert dd/mm/yyyy ↔ yyyy-mm-dd for <input type="date">
const dobToISO = (dob) => {
  if (!dob) return ''
  const m = dob.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  return m ? `${m[3]}-${m[2]}-${m[1]}` : ''
}
const isoToDob = (iso) => {
  if (!iso) return ''
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : ''
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = {
  user: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="8" cy="5.5" r="2.5" /><path d="M3 13c0-2.5 2.2-4.5 5-4.5s5 2 5 4.5" /></svg>,
  mail: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="2" y="3.5" width="12" height="9" rx="1.5" /><path d="m2.5 4.5 5.5 4 5.5-4" /></svg>,
  phone: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 2.5h2l1.5 3-2 1.5a8 8 0 0 0 4.5 4.5l1.5-2 3 1.5v2c0 .5-.5 1-1 1A11 11 0 0 1 2 3.5c0-.5.5-1 1-1Z" /></svg>,
  cake: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="2.5" y="7" width="11" height="6" rx="1" /><path d="M5 7V5M8 7V5M11 7V5M2.5 10s1.5 1 3 0 3 0 4.5 0 3-1 3 0" /></svg>,
  check: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 8.5 3.5 3.5L13 5" /></svg>,
  alert: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="8" cy="8" r="6" /><path d="M8 5v3.5M8 11h.01" /></svg>,
  logout: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11.5v1.5H3V3h6v1.5" /><path d="M11 5.5 13.5 8 11 10.5M6 8h7.5" /></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 1.5 2.5 4v4.5C2.5 11 5 13.5 8 14.5c3-1 5.5-3.5 5.5-6V4Z" /><path d="m6 8 1.5 1.5L10.5 6.5" /></svg>,
  copy: <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="5" y="5" width="9" height="9" rx="1.5" /><path d="M11 5V3.5A1 1 0 0 0 10 2.5H3a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1.5" /></svg>,
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ open, onCancel, onConfirm, isDark }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,14,26,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className={`prof-toast w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900 border border-white/10' : 'bg-white'}`}>
        <div className="px-6 py-5">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            {Icon.logout}
          </div>
          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Đăng xuất khỏi tài khoản?</h3>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Bạn sẽ cần đăng nhập lại để truy cập tài khoản và quản lý vé.
          </p>
        </div>
        <div className={`flex gap-2 border-t px-6 py-4 ${isDark ? 'border-white/10 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
          <button onClick={onCancel}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-semibold transition ${isDark ? 'border-white/10 text-slate-300 hover:bg-white/5' : 'border-slate-200 text-slate-700 hover:bg-white'
              }`}>
            Hủy
          </button>
          <button onClick={onConfirm}
            className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-500/20 transition hover:opacity-90 active:scale-[0.98]">
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function Profile() {
  const navigate = useNavigate()
  const { user, authLoading, logout, updateUser } = useAuth()
  const { isDark } = useTheme()

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', dob: '', gender: '' })
  const [original, setOriginal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null) // { type: 'success'|'error', msg: string }
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [copied, setCopied] = useState(false)

  const [tickets, setTickets] = useState([])
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/', { replace: true }); return }
    const initial = {
      full_name: user.full_name ?? '',
      email: user.email ?? '',
      phone: user.phone ?? '',
      dob: dobToISO(user.dob ?? ''),  // ISO for <input type="date">
      gender: user.gender ?? '',
    }
    setForm(initial)
    setOriginal(initial)
  }, [user, authLoading, navigate])

  // Fetch tickets for stats
  useEffect(() => {
    if (authLoading || !user) return
    setStatsLoading(true)
    ticketsApi.list()
      .then(setTickets)
      .catch(() => setTickets([]))  // silent fail - stats là phụ, không cần báo lỗi
      .finally(() => setStatsLoading(false))
  }, [user, authLoading])

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const isDirty = useMemo(() => {
    if (!original) return false
    return Object.keys(form).some(k => form[k] !== original[k])
  }, [form, original])

  const stats = useMemo(() => {
    // Vé đã mua = tổng số vé
    const ticketCount = tickets.length

    // Sự kiện = số sự kiện unique (dedupe theo event_id, fallback event_title)
    const eventSet = new Set(
      tickets.map(t => t.event_id ?? t.event_title).filter(Boolean)
    )
    const eventCount = eventSet.size

    return { ticketCount, eventCount }
  }, [tickets])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleReset = () => {
    if (original) setForm(original)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setToast(null)
    try {
      const updated = await authApi.updateMe({
        full_name: form.full_name.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        dob: isoToDob(form.dob) || undefined,  // back to dd/mm/yyyy
        gender: form.gender || undefined,
      })
      updateUser(updated)
      setOriginal(form)
      setToast({ type: 'success', msg: 'Cập nhật thông tin thành công.' })
    } catch (err) {
      setToast({ type: 'error', msg: err.message || 'Cập nhật thất bại.' })
    } finally {
      setSaving(false)
    }
  }

  const handleCopyUsername = () => {
    if (!user?.username) return
    navigator.clipboard?.writeText(user.username).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  // ─── Theme tokens ───────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-slate-950' : 'bg-slate-50'
  const text = isDark ? 'text-slate-100' : 'text-slate-900'
  const muted = isDark ? 'text-slate-400' : 'text-slate-500'
  const subtle = isDark ? 'text-slate-500' : 'text-slate-400'
  const card = isDark ? 'border-white/10 bg-slate-900/60 backdrop-blur-sm' : 'border-slate-200/80 bg-white'
  const inputCls = isDark
    ? 'w-full rounded-xl border border-white/10 bg-slate-800/60 px-3.5 py-2.5 text-sm text-white outline-none transition placeholder-slate-500 focus:border-sky-400/60 focus:bg-slate-800 focus:ring-2 focus:ring-sky-400/15'
    : 'w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder-slate-400 focus:border-sky-400/70 focus:bg-white focus:ring-2 focus:ring-sky-400/15'
  const labelCls = `mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`

  if (authLoading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${bg}`}>
        <div className={`flex items-center gap-2 text-sm ${muted}`}>
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
          Đang tải hồ sơ...
        </div>
      </div>
    )
  }

  const initial = (user?.full_name?.[0] || user?.username?.[0] || '?').toUpperCase()
  const isAdmin = user?.role === 'admin'

  return (
    <>
      <style>{CSS}</style>
      <div className={`min-h-screen ${bg} ${text}`}>

        {/* ── Cover banner ── */}
        <div className="prof-cover-bg relative h-44 w-full overflow-hidden md:h-56">
          {/* decorative grid pattern */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
              maskImage: 'radial-gradient(ellipse at top, black 0%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(ellipse at top, black 0%, transparent 70%)',
            }}
          />
          {/* fade to bg */}
          <div className={`absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b ${isDark ? 'from-transparent to-slate-950' : 'from-transparent to-slate-50'}`} />
        </div>

        <section className="mx-auto -mt-20 max-w-6xl px-4 pb-16 md:px-8">

          {/* ── Toast ── */}
          {toast && (
            <div className={`prof-toast pointer-events-auto fixed right-6 top-6 z-40 flex items-center gap-2.5 rounded-xl border px-4 py-3 shadow-lg ${toast.type === 'success'
              ? (isDark ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-400' : 'border-emerald-200 bg-emerald-50 text-emerald-700')
              : (isDark ? 'border-rose-400/30 bg-rose-500/10 text-rose-400' : 'border-rose-200 bg-rose-50 text-rose-700')
              }`}>
              {toast.type === 'success' ? Icon.check : Icon.alert}
              <p className="text-sm font-medium">{toast.msg}</p>
              <button onClick={() => setToast(null)} className="ml-2 opacity-50 hover:opacity-100">
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l10 10M13 3L3 13" /></svg>
              </button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[340px_1fr]">

            {/* ═══ LEFT COLUMN ═══ */}
            <div className="space-y-5">

              {/* Profile card */}
              <div className={`prof-section-1 rounded-3xl border p-6 shadow-sm ${card}`}>
                {/* Avatar */}
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div className={`flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500 to-indigo-500 text-3xl font-extrabold text-white shadow-lg shadow-sky-500/30 ring-4 ${isDark ? 'ring-slate-950' : 'ring-white'}`}>
                      {initial}
                    </div>
                    {/* online dot */}
                    <span className={`absolute bottom-1 right-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ${isDark ? 'ring-slate-900' : 'ring-white'}`}>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                    </span>
                  </div>
                </div>

                <div className="text-center">
                  <h2 className="text-xl font-extrabold tracking-tight">{user?.full_name || 'Chưa có tên'}</h2>
                  <button onClick={handleCopyUsername}
                    className={`mt-1 inline-flex items-center gap-1.5 text-sm transition ${muted} hover:text-sky-500`}
                    title="Sao chép tên đăng nhập">
                    @{user?.username}
                    <span className="opacity-60">{copied ? Icon.check : Icon.copy}</span>
                  </button>
                </div>

                {/* Role badge */}
                <div className="mt-4 flex justify-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${isAdmin
                    ? (isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-400' : 'border-amber-200 bg-amber-50 text-amber-700')
                    : (isDark ? 'border-sky-400/30 bg-sky-400/10 text-sky-400' : 'border-sky-200 bg-sky-50 text-sky-700')
                    }`}>
                    {isAdmin ? Icon.shield : Icon.user}
                    {isAdmin ? 'Quản trị viên' : 'Thành viên'}
                  </span>
                </div>

                {/* Stats */}
                <div className={`mt-5 grid grid-cols-2 gap-2 border-t pt-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <div className="text-center">
                    {statsLoading ? (
                      <div className={`mx-auto h-6 w-8 animate-pulse rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    ) : (
                      <p className="text-xl font-extrabold tabular-nums">{stats.eventCount}</p>
                    )}
                    <p className={`mt-1 text-[10px] font-semibold uppercase tracking-widest ${subtle}`}>Sự kiện</p>
                  </div>
                  <div className="text-center">
                    {statsLoading ? (
                      <div className={`mx-auto h-6 w-8 animate-pulse rounded ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    ) : (
                      <p className="text-xl font-extrabold tabular-nums">{stats.ticketCount}</p>
                    )}
                    <p className={`mt-1 text-[10px] font-semibold uppercase tracking-widest ${subtle}`}>Vé đã mua</p>
                  </div>
                </div>
              </div>

              {/* Quick info */}
              <div className={`prof-section-2 rounded-3xl border p-5 shadow-sm ${card}`}>
                <p className={`mb-3 text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Liên hệ</p>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>{Icon.mail}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${subtle}`}>Email</p>
                      <p className="truncate text-sm font-medium">{user?.email || '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-slate-800 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>{Icon.phone}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[10px] font-semibold uppercase tracking-wide ${subtle}`}>Điện thoại</p>
                      <p className="truncate text-sm font-medium">{user?.phone || '-'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logout */}
              <button onClick={() => setConfirmLogout(true)}
                className={`prof-section-3 group flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isDark
                  ? 'border-rose-500/30 bg-rose-500/5 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/50'
                  : 'border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                  }`}>
                <span className="transition-transform group-hover:translate-x-0.5">{Icon.logout}</span>
                Đăng xuất
              </button>
            </div>

            {/* ═══ RIGHT COLUMN ═══ */}
            <div className="space-y-5">

              {/* Header */}
              <div className="prof-section-1">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-500">Tài khoản</p>
                <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">Thông tin cá nhân</h1>
                <p className={`mt-1.5 text-sm ${muted}`}>
                  Quản lý thông tin hiển thị trên hồ sơ và phục vụ cho việc đặt vé.
                </p>
              </div>

              {/* Edit form */}
              <div className={`prof-section-2 overflow-hidden rounded-3xl border shadow-sm ${card}`}>
                <div className={`flex items-center justify-between border-b px-6 py-4 ${isDark ? 'border-white/10' : 'border-slate-100'}`}>
                  <div className="flex items-center gap-2.5">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-50 text-sky-600'}`}>
                      {Icon.user}
                    </div>
                    <h2 className="text-base font-bold">Chỉnh sửa thông tin</h2>
                  </div>
                  {isDirty && (
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isDark ? 'bg-amber-400/15 text-amber-400' : 'bg-amber-50 text-amber-700'
                      }`}>
                      Chưa lưu
                    </span>
                  )}
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className={labelCls}>{Icon.user} Họ và tên</label>
                      <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Nguyễn Văn A" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{Icon.mail} Email</label>
                      <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="a@mail.com" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{Icon.phone} Điện thoại</label>
                      <input name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="0901 234 567" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{Icon.cake} Ngày sinh</label>
                      <input name="dob" type="date" value={form.dob} onChange={handleChange} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Giới tính</label>
                      <select name="gender" value={form.gender} onChange={handleChange} className={inputCls}>
                        <option value="">-- Chọn --</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  {/* Read-only username */}
                  <div className={`rounded-xl border-2 border-dashed p-3.5 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/40'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${subtle}`}>Tên đăng nhập</p>
                        <p className="mt-0.5 truncate text-sm font-bold">@{user?.username}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                        Không thể đổi
                      </span>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className={`-mx-6 -mb-6 mt-2 flex items-center justify-end gap-2 border-t px-6 py-4 ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-slate-100 bg-slate-50/40'}`}>
                    <button type="button" onClick={handleReset} disabled={!isDirty || saving}
                      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-40 ${isDark ? 'text-slate-300 hover:bg-white/5' : 'text-slate-600 hover:bg-slate-100'
                        }`}>
                      Hủy thay đổi
                    </button>
                    <button type="submit" disabled={!isDirty || saving}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-500/25 transition hover:opacity-90 active:scale-[0.98] disabled:from-slate-400 disabled:to-slate-400 disabled:opacity-50 disabled:shadow-none">
                      {saving ? (
                        <>
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Đang lưu…
                        </>
                      ) : (
                        <>
                          {Icon.check}
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security tip */}
              <div className={`prof-section-3 flex items-start gap-3 rounded-2xl border p-4 ${isDark ? 'border-sky-400/20 bg-sky-500/5' : 'border-sky-100 bg-sky-50/40'
                }`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isDark ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
                  {Icon.shield}
                </div>
                <div className="flex-1">
                  <p className={`text-sm font-bold ${isDark ? 'text-sky-300' : 'text-sky-900'}`}>Bảo mật tài khoản</p>
                  <p className={`mt-0.5 text-xs leading-relaxed ${muted}`}>
                    Đảm bảo email và số điện thoại luôn cập nhật để nhận vé điện tử và mã xác thực khi đặt vé.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Confirm logout */}
        <ConfirmDialog
          open={confirmLogout}
          onCancel={() => setConfirmLogout(false)}
          onConfirm={() => { setConfirmLogout(false); logout(); navigate('/') }}
          isDark={isDark}
        />
      </div>
    </>
  )
}

export default Profile