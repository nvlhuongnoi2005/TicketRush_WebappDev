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

  const resetForm = () => {
    setForm(emptyForm)
    setSectionDraft(emptySection)
    setEditingId(null)
  }

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

    const sections =
      form.sections.length > 0
        ? form.sections
        : editingId
          ? getEvents().find((event) => event.id === editingId)?.sections || []
          : []

    if (editingId) {
      updateEvent(editingId, {
        ...form,
        id: editingId,
        min_price: Number(form.min_price),
        total_seats: Number(form.total_seats),
        available_seats: Number(form.available_seats),
        sections,
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

  const startEdit = (event) => {
    setEditingId(event.id)
    setForm({
      category: event.category ?? 'Music',
      title: event.title ?? '',
      artist: event.artist ?? '',
      venue_name: event.venue_name ?? '',
      venue_address: event.venue_address ?? '',
      event_date: event.event_date ?? '',
      sale_start: event.sale_start ?? '',
      sale_end: event.sale_end ?? '',
      banner_url: event.banner_url ?? '',
      status: event.status ?? 'draft',
      queue_enabled: Boolean(event.queue_enabled),
      min_price: event.min_price ?? 500000,
      total_seats: event.total_seats ?? 1000,
      available_seats: event.available_seats ?? event.total_seats ?? 1000,
      description: event.description ?? '',
      sections: event.sections ?? [],
    })
    setSectionDraft(emptySection)
  }

  const handleDelete = (id) => {
    deleteEvent(id)
    syncEvents()
    if (editingId === id) resetForm()
  }

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin events</p>
            <h1 className="text-3xl font-semibold">Create, edit, and manage events</h1>
          </div>
          <Link to="/admin/events/create" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
            New event page
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{editingId ? 'Edit event' : 'Create event'}</h2>
                <p className="mt-1 text-sm text-slate-500">Keep the event catalog and seat sections in sync.</p>
              </div>
              <button type="button" onClick={resetForm} className="text-sm font-medium text-sky-600">
                Reset
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Category</span>
                <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400">
                  <option>Music</option>
                  <option>Sports</option>
                  <option>Theater</option>
                  <option>Festival</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Status</span>
                <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400">
                  <option>draft</option>
                  <option>published</option>
                  <option>sold_out</option>
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Title</span>
                <input name="title" value={form.title} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Artist / performer</span>
                <input name="artist" value={form.artist} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-slate-600">Description</span>
                <textarea name="description" rows="4" value={form.description} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Venue name</span>
                <input name="venue_name" value={form.venue_name} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Venue address</span>
                <input name="venue_address" value={form.venue_address} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Event date</span>
                <input type="datetime-local" name="event_date" value={form.event_date} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Sale start</span>
                <input type="datetime-local" name="sale_start" value={form.sale_start} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Sale end</span>
                <input type="datetime-local" name="sale_end" value={form.sale_end} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm md:col-span-2">
                <span className="text-slate-600">Banner URL</span>
                <input name="banner_url" value={form.banner_url} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-sky-400" />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm md:col-span-2">
                <input type="checkbox" name="queue_enabled" checked={form.queue_enabled} onChange={handleChange} className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-400" />
                Enable waiting room queue
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Min price</span>
                <input type="number" name="min_price" value={form.min_price} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Total seats</span>
                <input type="number" name="total_seats" value={form.total_seats} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
              </label>

              <label className="space-y-2 text-sm">
                <span className="text-slate-600">Available seats</span>
                <input type="number" name="available_seats" value={form.available_seats} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Seat sections</h3>
                  <p className="text-sm text-slate-500">Build the seat map sections used by the checkout flow.</p>
                </div>
                <button type="button" onClick={addSectionToForm} className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400">
                  Add section
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Section name</span>
                  <input name="name" value={sectionDraft.name} onChange={handleSectionDraftChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Rows</span>
                  <input type="number" name="rows" value={sectionDraft.rows} onChange={handleSectionDraftChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Columns</span>
                  <input type="number" name="cols" value={sectionDraft.cols} onChange={handleSectionDraftChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Price</span>
                  <input type="number" name="price" value={sectionDraft.price} onChange={handleSectionDraftChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Color</span>
                  <input type="color" name="color" value={sectionDraft.color} onChange={handleSectionDraftChange} className="h-[46px] w-full rounded-xl border border-slate-200 bg-white px-2 py-1" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-slate-600">Available seats</span>
                  <input type="number" name="available_seats" value={sectionDraft.available_seats} onChange={handleSectionDraftChange} className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-sky-400" />
                </label>
              </div>

              <div className="mt-4 space-y-3">
                {form.sections.map((section) => (
                  <div key={section.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm shadow-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{section.name}</p>
                      <p className="text-slate-500">
                        {section.rows} x {section.cols} seats · {Number(section.price).toLocaleString('vi-VN')} VND
                      </p>
                    </div>
                    <button type="button" onClick={() => removeSection(section.id)} className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button type="submit" className="rounded-full bg-sky-500 px-5 py-3 font-semibold text-white transition hover:bg-sky-400">
                {editingId ? 'Update event' : 'Create event'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="rounded-full border border-slate-200 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-50">
                  Cancel edit
                </button>
              )}
            </div>
          </form>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg shadow-slate-200/60">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Managed events</h2>
                <p className="mt-1 text-sm text-slate-500">Edit or remove an event from the catalog.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{sortedEvents.length} events</span>
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Seats</th>
                    <th className="px-4 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {sortedEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50">
                      <td className="px-4 py-4 align-top">
                        <p className="font-semibold text-slate-900">{event.title}</p>
                        <p className="text-slate-500">{event.artist}</p>
                      </td>
                      <td className="px-4 py-4 align-top capitalize text-slate-600">{event.status}</td>
                      <td className="px-4 py-4 align-top text-slate-600">
                        {Number(event.available_seats ?? 0).toLocaleString('vi-VN')} / {Number(event.total_seats ?? 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" onClick={() => startEdit(event)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50">
                            Edit
                          </button>
                          <button type="button" onClick={() => handleDelete(event.id)} className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400">
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