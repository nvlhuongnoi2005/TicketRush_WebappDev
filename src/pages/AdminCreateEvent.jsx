import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import SeatCanvasDrawer from '../components/SeatCanvasDrawer'
import { addEvent, getEvents } from '../lib/eventStorage'

const emptyForm = {
  category: 'Music',
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
  min_price: 500000,
  total_seats: 1000,
  available_seats: 1000,
  description: '',
  sections: [],
}

const emptySection = {
  name: '',
  rows: 10,
  cols: 10,
  price: 500000,
  color: '#22c55e',
  available_seats: 100,
}

function AdminCreateEvent() {
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [sectionDraft, setSectionDraft] = useState(emptySection)
  const [error, setError] = useState('')
  const [seatConfigMode, setSeatConfigMode] = useState('matrix') // 'matrix' or 'canvas'

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
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

    const totalSeats = Number(sectionDraft.rows) * Number(sectionDraft.cols)

    setForm((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          ...sectionDraft,
          id: Date.now(),
          name: sectionDraft.name.trim(),
          rows: Number(sectionDraft.rows),
          cols: Number(sectionDraft.cols),
          price: Number(sectionDraft.price),
          total_seats: totalSeats,
          available_seats: Math.min(Number(sectionDraft.available_seats), totalSeats),
        },
      ],
    }))

    setSectionDraft(emptySection)
  }

  const removeSection = (sectionId) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }))
  }

  const handleCanvasGenerateSections = (newSections) => {
    setForm((prev) => ({
      ...prev,
      sections: [...prev.sections, ...newSections],
    }))
    setSeatConfigMode('matrix') // Show the sections list
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) return setError('Event title is required.')
    if (!form.artist.trim()) return setError('Artist is required.')
    if (!form.venue_name.trim()) return setError('Venue name is required.')
    if (!form.event_date) return setError('Event date is required.')
    if (!form.banner_url.trim()) return setError('Banner URL is required.')
    if (!form.sections.length) return setError('Add at least one seat section.')

    const nextId = Math.max(...getEvents().map((event) => event.id), 0) + 1

    addEvent({
      ...form,
      id: nextId,
      min_price: Number(form.min_price),
      total_seats: Number(form.total_seats),
      available_seats: Number(form.available_seats),
      sections: form.sections,
    })

    navigate('/admin/events')
  }

  return (
    <div className={`${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin create event</p>
            <h1 className="text-3xl font-semibold">Create a new event</h1>
          </div>
          <Link to="/admin/events" className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-slate-700 text-slate-50 hover:bg-slate-800' : 'border-slate-200 text-slate-900 hover:bg-slate-100'}`}>
            Back to events
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className={`rounded-3xl border p-5 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <h2 className="mb-4 text-xl font-semibold">Event information</h2>
            <div className="grid gap-3">
              {[
                ['category', 'Category'],
                ['title', 'Title'],
                ['artist', 'Artist'],
                ['venue_name', 'Venue name'],
                ['venue_address', 'Venue address'],
                ['event_date', 'Event date'],
                ['sale_start', 'Sale start'],
                ['sale_end', 'Sale end'],
                ['banner_url', 'Banner URL'],
              ].map(([name, label]) => (
                <div key={name}>
                  <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    type={name.includes('date') || name.includes('start') || name.includes('end') ? 'datetime-local' : 'text'}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50 focus:border-sky-500' : 'border-slate-200 bg-white text-slate-900 focus:border-sky-400'}`}
                  />
                </div>
              ))}

              <div>
                <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                >
                  <option value="draft">Draft</option>
                  <option value="on_sale">On sale</option>
                  <option value="sold_out">Sold out</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <label className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                <input type="checkbox" name="queue_enabled" checked={form.queue_enabled} onChange={handleChange} />
                Enable virtual queue
              </label>

              {['min_price', 'total_seats', 'available_seats'].map((name) => (
                <div key={name}>
                  <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{name.replace('_', ' ')}</label>
                  <input
                    name={name}
                    type="number"
                    value={form[name]}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                  />
                </div>
              ))}

              <div>
                <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                />
              </div>
            </div>
          </div>

          <div className={`rounded-3xl border p-5 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <div className="mb-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Seat configuration</h2>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Add sections before creating the event.</p>
                </div>
                <span className={`text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{form.sections.length} section(s)</span>
              </div>

              {/* Mode tabs */}
              <div className="flex gap-2 border-b" style={{ borderColor: isDark ? '#334155' : '#e2e8f0' }}>
                <button
                  type="button"
                  onClick={() => setSeatConfigMode('matrix')}
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    seatConfigMode === 'matrix'
                      ? 'border-b-2 border-sky-500 text-sky-500'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Matrix Mode
                </button>
                <button
                  type="button"
                  onClick={() => setSeatConfigMode('canvas')}
                  className={`px-4 py-2 text-sm font-semibold transition ${
                    seatConfigMode === 'canvas'
                      ? 'border-b-2 border-sky-500 text-sky-500'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-300'
                        : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Canvas Designer
                </button>
              </div>
            </div>

            {/* Canvas mode */}
            {seatConfigMode === 'canvas' && <SeatCanvasDrawer onSectionsGenerated={handleCanvasGenerateSections} />}

            {/* Matrix mode */}
            {seatConfigMode === 'matrix' && (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <div>
                    <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Section name</label>
                    <input
                      name="name"
                      value={sectionDraft.name}
                      onChange={handleSectionDraftChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                      placeholder="VIP"
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Rows</label>
                    <input
                      name="rows"
                      type="number"
                      value={sectionDraft.rows}
                      onChange={handleSectionDraftChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Columns</label>
                    <input
                      name="cols"
                      type="number"
                      value={sectionDraft.cols}
                      onChange={handleSectionDraftChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Price</label>
                    <input
                      name="price"
                      type="number"
                      value={sectionDraft.price}
                      onChange={handleSectionDraftChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Color</label>
                    <input
                      name="color"
                      type="text"
                      value={sectionDraft.color}
                      onChange={handleSectionDraftChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                      placeholder="#22c55e"
                    />
                  </div>
                  <div>
                    <label className={`mb-1 block text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Available seats</label>
                    <input
                      name="available_seats"
                      type="number"
                      value={sectionDraft.available_seats}
                      onChange={handleSectionDraftChange}
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-slate-50' : 'border-slate-200 bg-white text-slate-900'}`}
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addSectionToForm}
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
                >
                  Add section
                </button>

                <div className="mt-4 grid gap-3">
                  {form.sections.length ? (
                    form.sections.map((section) => (
                      <div key={section.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 text-sm ${isDark ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-50'}`}>
                        <div>
                          <p className="font-semibold" style={{ color: section.color }}>
                            {section.name}
                          </p>
                          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                            {section.rows} rows × {section.cols} cols · {section.price.toLocaleString()} VND · {section.available_seats}/{section.total_seats} seats
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSection(section.id)}
                          className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600"
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={`rounded-2xl border border-dashed p-4 text-sm ${isDark ? 'border-slate-700 bg-slate-700 text-slate-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                      No seat sections added yet.
                    </div>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="mt-5 w-full rounded-full bg-sky-500 px-5 py-3 font-semibold text-white hover:bg-sky-600">
              Create event
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AdminCreateEvent
