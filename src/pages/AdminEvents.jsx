import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addEvent, deleteEvent, getEvents, updateEvent } from '../lib/eventStorage'

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

function AdminEvents() {
  const [events, setEvents] = useState(() => getEvents())
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [sectionDraft, setSectionDraft] = useState(emptySection)

  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.id - b.id), [events])

  const syncEvents = () => setEvents(getEvents())

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setSectionDraft(emptySection)
    setEditingId(null)
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
      total_seats: prev.total_seats,
      sections: [
        ...prev.sections,
        {
          ...sectionDraft,
          id: Date.now(),
          name: sectionDraft.name.trim(),
          rows: Number(sectionDraft.rows),
          cols: Number(sectionDraft.cols),
          price: Number(sectionDraft.price),
          total_seats: Number(sectionDraft.rows) * Number(sectionDraft.cols),
          available_seats: Math.min(Number(sectionDraft.available_seats), Number(sectionDraft.rows) * Number(sectionDraft.cols)),
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

    if (editingId) {
      updateEvent(editingId, {
        ...form,
        id: editingId,
        min_price: Number(form.min_price),
        total_seats: Number(form.total_seats),
        available_seats: Number(form.available_seats),
        sections:
          form.sections.length > 0
            ? form.sections
            : getEvents().find((event) => event.id === editingId)?.sections || [],
      })
    } else {
      const nextId = Math.max(...events.map((event) => event.id), 0) + 1
      addEvent({
        ...form,
        id: nextId,
        min_price: Number(form.min_price),
        total_seats: Number(form.total_seats),
        available_seats: Number(form.available_seats),
        sections: form.sections,
      })
    }

    syncEvents()
    resetForm()
  }

  const handleEdit = (event) => {
    setEditingId(event.id)
    setForm({
      category: event.category || 'Music',
      title: event.title,
      artist: event.artist,
      venue_name: event.venue_name,
      venue_address: event.venue_address || '',
      event_date: event.event_date,
      sale_start: event.sale_start || '',
      sale_end: event.sale_end || '',
      banner_url: event.banner_url,
      status: event.status,
      queue_enabled: event.queue_enabled,
      min_price: event.min_price,
      total_seats: event.total_seats,
      available_seats: event.available_seats,
      description: event.description || '',
      sections: event.sections || [],
    })
    setSectionDraft(emptySection)
  }

  const handleDelete = (eventId) => {
    if (window.confirm('Delete this event?')) {
      deleteEvent(eventId)
      syncEvents()
      if (editingId === eventId) {
        resetForm()
      }
    }
  }

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Admin events</p>
            <h1 className="text-3xl font-semibold">Manage event catalog</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium">
              Dashboard
            </Link>
            <Link to="/admin/events/create" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950">
              Create event
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{editingId ? 'Edit event' : 'Create event'}</h2>
              {editingId && (
                <button type="button" onClick={resetForm} className="text-sm text-cyan-200">
                  Cancel edit
                </button>
              )}
            </div>

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

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Seat configuration</h3>
                  <p className="text-sm text-slate-400">Define the seat sections that will appear on the seat map.</p>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {form.sections.length} section(s)
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Section name</label>
                  <input
                    name="name"
                    value={sectionDraft.name}
                    onChange={handleSectionDraftChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Columns</label>
                  <input
                    name="cols"
                    type="number"
                    value={sectionDraft.cols}
                    onChange={handleSectionDraftChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Price</label>
                  <input
                    name="price"
                    type="number"
                    value={sectionDraft.price}
                    onChange={handleSectionDraftChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Color</label>
                  <input
                    name="color"
                    type="text"
                    value={sectionDraft.color}
                    onChange={handleSectionDraftChange}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
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
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
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
                    No seat sections added yet. Add at least one section so the seat map can be configured.
                  </div>
                )}
              </div>
            </div>

            <button type="submit" className="mt-5 w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
              {editingId ? 'Update event' : 'Create event'}
            </button>
          </form>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Event list</h2>
                <p className="text-sm text-slate-400">Add, edit, or delete events. Changes update the home page immediately.</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                <thead className="bg-slate-900 text-slate-300">
                  <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Seats</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {sortedEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-white/5">
                      <td className="px-4 py-4">{event.id}</td>
                      <td className="px-4 py-4">{event.title}</td>
                      <td className="px-4 py-4">{event.category || 'Music'}</td>
                      <td className="px-4 py-4">{new Date(event.event_date).toLocaleString()}</td>
                      <td className="px-4 py-4">{event.status}</td>
                      <td className="px-4 py-4">{event.total_seats}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Link to={`/events/${event.id}`} className="rounded-full bg-white/10 px-3 py-2 text-xs">
                            View
                          </Link>
                          <button type="button" onClick={() => handleEdit(event)} className="rounded-full bg-amber-300 px-3 py-2 text-xs font-semibold text-slate-950">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(event.id)} className="rounded-full bg-rose-400 px-3 py-2 text-xs font-semibold text-white">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminEvents
