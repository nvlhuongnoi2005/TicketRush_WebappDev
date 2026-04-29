import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { adminApi } from '../lib/api'

const emptyForm = {
  title: '',
  artist: '',
  venue_name: '',
  venue_address: '',
  event_date: '',
  sale_start: '',
  sale_end: '',
  banner_url: '',
  queue_enabled: false,
  description: '',
  sections: [],
}

const emptySection = {
  name: '',
  rows: 10,
  cols: 10,
  price: 500000,
  color: '#22c55e',
}

function AdminCreateEvent() {
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [sectionDraft, setSectionDraft] = useState(emptySection)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSectionDraftChange = (e) => {
    const { name, value } = e.target
    setSectionDraft((prev) => ({
      ...prev,
      [name]: name === 'name' || name === 'color' ? value : Number(value),
    }))
  }

  const addSectionToForm = () => {
    if (!sectionDraft.name.trim()) return
    setForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          ...sectionDraft,
          _tempId: Date.now(),
          name: sectionDraft.name.trim(),
          rows: Number(sectionDraft.rows),
          cols: Number(sectionDraft.cols),
          price: Number(sectionDraft.price),
          total_seats: Number(sectionDraft.rows) * Number(sectionDraft.cols),
        },
      ],
    }))
    setSectionDraft(emptySection)
  }

  const removeSection = (tempId) => {
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((s) => s._tempId !== tempId) }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Vui lòng nhập tên sự kiện.')
    if (!form.venue_name.trim()) return setError('Vui lòng nhập tên địa điểm.')
    if (!form.event_date) return setError('Vui lòng chọn ngày diễn ra.')
    if (!form.sections.length) return setError('Thêm ít nhất một khu vực ghế.')

    setSaving(true)
    try {
      const newEvent = await adminApi.events.create({
        title: form.title.trim(),
        artist: form.artist.trim() || undefined,
        venue_name: form.venue_name.trim(),
        venue_address: form.venue_address.trim() || undefined,
        event_date: form.event_date,
        sale_start: form.sale_start || undefined,
        sale_end: form.sale_end || undefined,
        banner_url: form.banner_url.trim() || undefined,
        queue_enabled: form.queue_enabled,
        description: form.description.trim() || undefined,
      })

      await Promise.all(
        form.sections.map((sec) =>
          adminApi.events.createSection(newEvent.id, {
            name: sec.name,
            rows: sec.rows,
            cols: sec.cols,
            price: sec.price,
            color: sec.color,
          })
        )
      )

      navigate('/admin/events')
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Admin</p>
            <h1 className="text-3xl font-semibold">Tạo sự kiện mới</h1>
          </div>
          <Link
            to="/admin/events"
            className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium transition hover:bg-white/10"
          >
            Quay lại
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          {/* Left: event info */}
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Thông tin sự kiện</h2>

            {[
              ['title', 'Tên sự kiện'],
              ['artist', 'Nghệ sĩ / Ban nhạc'],
              ['venue_name', 'Tên địa điểm'],
              ['venue_address', 'Địa chỉ'],
              ['banner_url', 'URL ảnh banner'],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                  {label}
                </label>
                <input
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            ))}

            {[
              ['event_date', 'Ngày diễn ra'],
              ['sale_start', 'Bắt đầu mở bán'],
              ['sale_end', 'Kết thúc mở bán'],
            ].map(([name, label]) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                  {label}
                </label>
                <input
                  name={name}
                  type="datetime-local"
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                />
              </div>
            ))}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm">
              <input
                type="checkbox"
                name="queue_enabled"
                checked={form.queue_enabled}
                onChange={handleChange}
                className="accent-cyan-400"
              />
              Bật hàng chờ ảo (Virtual Queue)
            </label>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                Mô tả
              </label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
              />
            </div>
          </div>

          {/* Right: seat sections */}
          <div className="flex flex-col gap-5">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Cấu hình khu vực ghế</h2>
                  <p className="text-sm text-slate-400">Ghế được tự động tạo theo rows × cols.</p>
                </div>
                <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                  {form.sections.length} khu vực
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ['name', 'text', 'Tên khu (VD: VIP)', 'name'],
                  ['rows', 'number', 'Số hàng', 'rows'],
                  ['cols', 'number', 'Số cột', 'cols'],
                  ['price', 'number', 'Giá (VND)', 'price'],
                  ['color', 'text', '#22c55e', 'color'],
                ].map(([field, type, placeholder, name]) => (
                  <div key={field}>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-[0.15em] text-slate-400">
                      {placeholder.startsWith('#') ? 'Màu hex' : placeholder}
                    </label>
                    <input
                      name={name}
                      type={type}
                      value={sectionDraft[name]}
                      onChange={handleSectionDraftChange}
                      placeholder={placeholder}
                      className="w-full rounded-xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addSectionToForm}
                className="mt-4 rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300"
              >
                + Thêm khu vực
              </button>

              <div className="mt-4 space-y-3">
                {form.sections.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 p-4 text-center text-sm text-slate-500">
                    Chưa có khu vực ghế nào. Thêm ít nhất một khu vực.
                  </div>
                ) : (
                  form.sections.map((sec) => (
                    <div
                      key={sec._tempId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-semibold" style={{ color: sec.color }}>
                          {sec.name}
                        </p>
                        <p className="text-slate-400">
                          {sec.rows} hàng × {sec.cols} cột &middot;{' '}
                          {sec.price.toLocaleString()} VND &middot; {sec.total_seats} ghế
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSection(sec._tempId)}
                        className="rounded-full bg-rose-400/20 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/30"
                      >
                        Xóa
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-50"
            >
              {saving ? 'Đang tạo...' : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AdminCreateEvent
