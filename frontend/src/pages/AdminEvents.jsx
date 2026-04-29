import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, api } from '../lib/api'

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
  const [events, setEvents] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sortedEvents = useMemo(() => [...events].sort((a, b) => b.id - a.id), [events])

  const fetchEvents = () => {
    adminApi.events.list()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchEvents() }, [])

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError('')
  }

  const handleEdit = (event) => {
    setEditingId(event.id)
    setForm({
      title: event.title || '',
      artist: event.artist || '',
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      event_date: event.event_date ? event.event_date.slice(0, 16) : '',
      sale_start: event.sale_start ? event.sale_start.slice(0, 16) : '',
      sale_end: event.sale_end ? event.sale_end.slice(0, 16) : '',
      banner_url: event.banner_url || '',
      status: event.status || 'draft',
      queue_enabled: event.queue_enabled || false,
      description: event.description || '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form }
      if (!payload.event_date) { setError('Event date is required.'); return }
      if (!payload.sale_start) delete payload.sale_start
      if (!payload.sale_end) delete payload.sale_end
      if (editingId) {
        await adminApi.events.update(editingId, payload)
      }
      fetchEvents()
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (eventId) => {
    if (!window.confirm('Delete this event? This cannot be undone.')) return
    try {
      await adminApi.events.delete(eventId)
      fetchEvents()
      if (editingId === eventId) resetForm()
    } catch (err) {
      alert(err.message)
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
          {editingId ? (
            <form onSubmit={handleSubmit} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold">Edit event #{editingId}</h2>
                <button type="button" onClick={resetForm} className="text-sm text-cyan-200 hover:text-cyan-100">
                  Cancel
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="grid gap-3">
                {[
                  ['title', 'Title'],
                  ['artist', 'Artist'],
                  ['venue_name', 'Venue name'],
                  ['venue_address', 'Venue address'],
                  ['banner_url', 'Banner URL'],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">{label}</label>
                    <input
                      name={name}
                      value={form[name]}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                    />
                  </div>
                ))}

                {[
                  ['event_date', 'Event date'],
                  ['sale_start', 'Sale start'],
                  ['sale_end', 'Sale end'],
                ].map(([name, label]) => (
                  <div key={name}>
                    <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">{label}</label>
                    <input
                      name={name}
                      type="datetime-local"
                      value={form[name]}
                      onChange={handleChange}
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

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Description</label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-5 w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Update event'}
              </button>

              {form.queue_enabled && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const r = await adminApi.events.admitQueue(editingId)
                        alert(`Admitted ${r.admitted} users`)
                      } catch (err) { alert(err.message) }
                    }}
                    className="flex-1 rounded-full bg-emerald-400 px-4 py-2 text-xs font-semibold text-slate-950"
                  >
                    Admit all queue now
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm('Clear all queue entries for this event?')) return
                      try {
                        await adminApi.events.clearQueue(editingId)
                        alert('Queue cleared')
                      } catch (err) { alert(err.message) }
                    }}
                    className="flex-1 rounded-full bg-rose-400 px-4 py-2 text-xs font-semibold text-white"
                  >
                    Clear queue
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="flex items-center justify-center rounded-3xl border border-dashed border-white/10 bg-white/5 p-8 text-slate-400">
              <p className="text-sm">Click Edit on an event to modify it.</p>
            </div>
          )}

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Event list</h2>
              <p className="text-sm text-slate-400">{events.length} event(s) total.</p>
            </div>

            {loading ? (
              <div className="py-8 text-center text-slate-400">Loading...</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <table className="min-w-full divide-y divide-white/10 text-left text-sm">
                  <thead className="bg-slate-900 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Queue</th>
                      <th className="px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {sortedEvents.map((event) => (
                      <tr key={event.id} className="hover:bg-white/5">
                        <td className="px-4 py-4">{event.id}</td>
                        <td className="px-4 py-4">{event.title}</td>
                        <td className="px-4 py-4">{new Date(event.event_date).toLocaleDateString()}</td>
                        <td className="px-4 py-4">{event.status}</td>
                        <td className="px-4 py-4">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${event.queue_enabled ? 'bg-cyan-400/20 text-cyan-300' : 'bg-white/10 text-slate-400'}`}>
                            {event.queue_enabled ? 'On' : 'Off'}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <Link to={`/events/${event.id}`} className="rounded-full bg-white/10 px-3 py-2 text-xs">
                              View
                            </Link>
                            <Link to={`/seat-map/${event.id}`} className="rounded-full bg-cyan-900/60 px-3 py-2 text-xs text-cyan-200">
                              Seat Map
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleEdit(event)}
                              className="rounded-full bg-amber-300 px-3 py-2 text-xs font-semibold text-slate-950"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(event.id)}
                              className="rounded-full bg-rose-400 px-3 py-2 text-xs font-semibold text-white"
                            >
                              Delete
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
