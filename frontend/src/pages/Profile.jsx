import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function Profile() {
  const navigate = useNavigate()
  const { user, authLoading, logout, updateUser } = useAuth()
  const { isDark } = useTheme()

  const [form, setForm] = useState({ full_name: '', email: '', phone: '', dob: '', gender: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (authLoading) return
    if (!user) { navigate('/login', { replace: true }); return }
    setForm({
      full_name: user.full_name ?? '',
      email:     user.email     ?? '',
      phone:     user.phone     ?? '',
      dob:       user.dob       ?? '',
      gender:    user.gender    ?? '',
    })
  }, [user, authLoading])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const updated = await authApi.updateMe({
        full_name: form.full_name.trim() || undefined,
        email:     form.email.trim()     || undefined,
        phone:     form.phone.trim()     || undefined,
        dob:       form.dob.trim()       || undefined,
        gender:    form.gender           || undefined,
      })
      updateUser(updated)
      setSuccess('Cập nhật thông tin thành công.')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const bg       = isDark ? 'bg-slate-950 text-white'     : 'bg-slate-50 text-slate-900'
  const card     = isDark ? 'border-white/10 bg-white/5'  : 'border-slate-200 bg-white'
  const inputCls = isDark
    ? 'w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-2.5 text-sm text-white outline-none transition focus:border-sky-400/60'
    : 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-400/60'
  const labelCls = `mb-1 block text-xs font-medium uppercase tracking-[0.15em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`

  if (authLoading) {
    return <div className={`py-16 text-center ${isDark ? 'text-slate-400 bg-slate-950' : 'text-slate-500 bg-slate-50'}`}>Đang tải...</div>
  }

  return (
    <div className={`min-h-screen ${bg}`}>
      <section className="mx-auto max-w-2xl px-4 py-10 md:px-8">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-500">Tài khoản</p>
          <h1 className="text-3xl font-semibold">Thông tin cá nhân</h1>
        </div>

        {/* Avatar / summary card */}
        <div className={`mb-6 flex items-center gap-4 rounded-3xl border p-5 ${card}`}>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-sky-500 text-2xl font-bold text-white">
            {(user?.full_name?.[0] || user?.username?.[0] || '?').toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold">{user?.full_name}</p>
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>@{user?.username}</p>
            <span className={`mt-1 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
              user?.role === 'admin'
                ? isDark ? 'border-amber-400/30 bg-amber-400/10 text-amber-400' : 'border-amber-400/40 bg-amber-50 text-amber-700'
                : isDark ? 'border-sky-400/30 bg-sky-400/10 text-sky-400'       : 'border-sky-200 bg-sky-50 text-sky-700'
            }`}>
              {user?.role}
            </span>
          </div>
        </div>

        {/* Edit form */}
        <div className={`rounded-3xl border p-6 ${card}`}>
          <h2 className="mb-5 text-xl font-semibold">Chỉnh sửa thông tin</h2>

          {success && (
            <div className="mb-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-400">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Họ và tên</label>
                <input name="full_name" value={form.full_name} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Số điện thoại</label>
                <input name="phone" value={form.phone} onChange={handleChange} placeholder="+84..." className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Ngày sinh (dd/mm/yyyy)</label>
                <input name="dob" value={form.dob} onChange={handleChange} placeholder="15/08/1998" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Giới tính</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className={inputCls}
                >
                  <option value="">-- Chọn --</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
              </div>
            </div>

            {/* Username (read-only) */}
            <div>
              <label className={labelCls}>Tên đăng nhập (không thể thay đổi)</label>
              <input
                value={user?.username ?? ''}
                readOnly
                className={`${inputCls} cursor-not-allowed opacity-60`}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className={`mt-6 rounded-3xl border p-5 ${isDark ? 'border-rose-400/20 bg-rose-400/5' : 'border-rose-200 bg-rose-50'}`}>
          <h3 className="mb-1 font-semibold text-rose-500">Đăng xuất</h3>
          <p className={`mb-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Phiên đăng nhập hiện tại sẽ bị kết thúc.
          </p>
          <button
            onClick={() => { logout(); navigate('/') }}
            className="rounded-full bg-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
          >
            Đăng xuất
          </button>
        </div>
      </section>
    </div>
  )
}

export default Profile
