import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [form, setForm] = useState(emptyForm)
  const [sectionDraft, setSectionDraft] = useState(emptySection)
  const [error, setError] = useState('')

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
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Admin create event</p>
            <h1 className="text-3xl font-semibold">Create a new event</h1>
          </div>
          <Link to="/admin/events" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium">
            Back to events
          </Link>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
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
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">{label}</label>
                  <input
                    name={name}
                    value={form[name]}
                    onChange={handleChange}
                    type={name.includes('date') || name.includes('start') || name.includes('end') ? 'datetime-local' : 'text'}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="on_sale">On sale</option>
                  <option value="sold_out">Sold out</option>
                  <option value="finished">Finished</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm">
                <input type="checkbox" name="queue_enabled" checked={form.queue_enabled} onChange={handleChange} />
                Enable virtual queue
              </label>

              {['min_price', 'total_seats', 'available_seats'].map((name) => (
                <div key={name}>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">{name.replace('_', ' ')}</label>
                  <input
                    name={name}
                    type="number"
                    value={form[name]}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Description</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="4"
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">Seat configuration</h2>
                <p className="text-sm text-slate-400">Add sections here before creating the event.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">{form.sections.length} section(s)</span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Section name</label>
                <input
                  name="name"
                  value={sectionDraft.name}
                  onChange={handleSectionDraftChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="VIP"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Rows</label>
                <input
                  name="rows"
                  type="number"
                  value={sectionDraft.rows}
                  onChange={handleSectionDraftChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Columns</label>
                <input
                  name="cols"
                  type="number"
                  value={sectionDraft.cols}
                  onChange={handleSectionDraftChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Price</label>
                <input
                  name="price"
                  type="number"
                  value={sectionDraft.price}
                  onChange={handleSectionDraftChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Color</label>
                <input
                  name="color"
                  type="text"
                  value={sectionDraft.color}
                  onChange={handleSectionDraftChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  placeholder="#22c55e"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Available seats</label>
                <input
                  name="available_seats"
                  type="number"
                  value={sectionDraft.available_seats}
                  onChange={handleSectionDraftChange}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={addSectionToForm}
              className="mt-4 rounded-full bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Add section
            </button>

            <div className="mt-4 grid gap-3">
              {form.sections.length ? (
                form.sections.map((section) => (
                  <div key={section.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold" style={{ color: section.color }}>
                        {section.name}
                      </p>
                      <p className="text-slate-400">
                        {section.rows} rows × {section.cols} cols · {section.price.toLocaleString()} VND · {section.available_seats}/{section.total_seats} seats
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="rounded-full bg-rose-400 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Remove
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-4 text-sm text-slate-400">
                  No seat sections added yet.
                </div>
              )}
            </div>

            <button type="submit" className="mt-5 w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
              Create event
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default AdminCreateEvent
