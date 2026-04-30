import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../lib/api'
import { useAuth } from '../context/AuthContext.jsx'

const emptyForm = {
  title: '',
  artist: '',
  venue_name: '',
  venue_address: '',
  event_date: '',
  sale_start: '',
  sale_end: '',
  banner_url: '',
  status: 'draft',
  queue_enabled: false,
  description: '',
}

function AdminEvents() {
  const { user, authLoading } = useAuth()
  const navigate = useNavigate()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') {
      navigate('/login', { replace: true })
    }
  }, [user, authLoading, navigate])

  const loadEvents = () =>
    adminApi.events.list()
      .then(setEvents)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))

  useEffect(() => { loadEvents() }, [])

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const startEdit = (ev) => {
    setEditingId(ev.id)
    setForm({
      title: ev.title ?? '',
      artist: ev.artist ?? '',
      venue_name: ev.venue_name ?? '',
      venue_address: ev.venue_address ?? '',
      event_date: ev.event_date?.slice(0, 16) ?? '',
      sale_start: ev.sale_start?.slice(0, 16) ?? '',
      sale_end: ev.sale_end?.slice(0, 16) ?? '',
      banner_url: ev.banner_url ?? '',
      status: ev.status ?? 'draft',
      queue_enabled: Boolean(ev.queue_enabled),
      description: ev.description ?? '',
    })
    setError('')
  }

  const resetForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('Tên sự kiện không được để trống.')
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        event_date: form.event_date || undefined,
        sale_start: form.sale_start || undefined,
        sale_end: form.sale_end || undefined,
        banner_url: form.banner_url.trim() || undefined,
        description: form.description.trim() || undefined,
      }
      await adminApi.events.update(editingId, payload)
      await loadEvents()
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa sự kiện này? Hành động không thể hoàn tác.')) return
    try {
      await adminApi.events.delete(id)
      setEvents((prev) => prev.filter((ev) => ev.id !== id))
      if (editingId === id) resetForm()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400'

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin</p>
            <h1 className="text-3xl font-semibold">Quản lý sự kiện</h1>
          </div>
          <Link
            to="/admin/events/create"
            className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
          >
            + Tạo sự kiện mới
          </Link>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
        )}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          {/* Edit form — only shown when editing */}
          {editingId && (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Chỉnh sửa sự kiện</h2>
                <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:text-slate-700">Hủy</button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  ['title', 'Tên sự kiện'],
                  ['artist', 'Nghệ sĩ'],
                  ['venue_name', 'Địa điểm'],
                  ['venue_address', 'Địa chỉ'],
                  ['banner_url', 'Banner URL'],
                ].map(([name, label]) => (
                  <div key={name} className={name === 'banner_url' ? 'md:col-span-2' : ''}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                    <input name={name} value={form[name]} onChange={handleChange} className={inputCls} />
                  </div>
                ))}

                {[
                  ['event_date', 'Ngày diễn ra'],
                  ['sale_start', 'Bắt đầu mở bán'],
                  ['sale_end', 'Kết thúc mở bán'],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
                    <input type="datetime-local" name={name} value={form[name]} onChange={handleChange} className={inputCls} />
                  </div>
                ))}

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-500">Trạng thái</label>
                  <select name="status" value={form.status} onChange={handleChange} className={inputCls}>
                    <option value="draft">Draft</option>
                    <option value="on_sale">On Sale</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="finished">Finished</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-500">Mô tả</label>
                  <textarea name="description" rows={3} value={form.description} onChange={handleChange} className={inputCls} />
                </div>

                <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:col-span-2">
                  <input type="checkbox" name="queue_enabled" checked={form.queue_enabled} onChange={handleChange} />
                  Bật hàng chờ ảo
                </label>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-5 rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400 disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </form>
          )}

          {/* Events table */}
          <div className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-lg ${editingId ? '' : 'xl:col-span-2'}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Danh sách sự kiện</h2>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{events.length} sự kiện</span>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-slate-400">Đang tải...</p>
            ) : events.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Chưa có sự kiện nào.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Sự kiện</th>
                      <th className="px-4 py-3 font-medium">Trạng thái</th>
                      <th className="px-4 py-3 font-medium">Ngày diễn</th>
                      <th className="px-4 py-3 font-medium">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {events.map((ev) => (
                      <tr key={ev.id} className={`hover:bg-slate-50 ${editingId === ev.id ? 'bg-sky-50' : ''}`}>
                        <td className="px-4 py-4 align-top">
                          <p className="font-semibold text-slate-900">{ev.title}</p>
                          {ev.artist && <p className="text-slate-500">{ev.artist}</p>}
                          {ev.venue_name && <p className="text-xs text-slate-400">{ev.venue_name}</p>}
                        </td>
                        <td className="px-4 py-4 align-top capitalize text-slate-600">{ev.status}</td>
                        <td className="px-4 py-4 align-top text-slate-600">
                          {ev.event_date ? new Date(ev.event_date).toLocaleDateString('vi-VN') : '—'}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEdit(ev)}
                              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ev.id)}
                              className="rounded-full bg-rose-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-400"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminEvents
