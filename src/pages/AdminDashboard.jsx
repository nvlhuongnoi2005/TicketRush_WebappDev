import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEvents, getEventById } from '../lib/eventStorage'
import { adminStats } from '../data/mockData'

function AdminDashboard() {
  const events = getEvents()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || 1)
  const selectedEvent = getEventById(selectedEventId)

  const seatStats = useMemo(() => {
    if (!selectedEvent) return []

    return selectedEvent.sections.map((section) => {
      const sold = Math.max(section.total_seats - section.available_seats - 5, 0)
      const locked = Math.min(5, section.available_seats)
      const available = Math.max(section.available_seats - locked, 0)
      const fill_pct = ((sold / section.total_seats) * 100).toFixed(1)

      return {
        section_name: section.name,
        total: section.total_seats,
        sold,
        locked,
        available,
        fill_pct,
      }
    })
  }, [selectedEvent])

  const kpis = [
    { label: 'Total events', value: adminStats.total_events },
    { label: 'Active events', value: adminStats.active_events },
    { label: 'Tickets sold', value: adminStats.total_tickets_sold.toLocaleString() },
    { label: 'Revenue', value: `${adminStats.total_revenue.toLocaleString()} VND` },
  ]

  return (
    <div className="bg-slate-50 text-slate-900">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin dashboard</p>
            <h1 className="text-3xl font-semibold">Real-time overview</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/events/create" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
              Create event
            </Link>
            <Link to="/admin/events" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100">
              Manage events
            </Link>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(Number(e.target.value))}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id} className="bg-white text-slate-900">
                  {event.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
              <p className="text-sm text-slate-500">{kpi.label}</p>
              <p className="mt-2 text-3xl font-semibold text-sky-700">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-xl font-semibold">Revenue - last 7 days</h2>
            <div className="mt-4 space-y-3">
              {adminStats.recent_revenue.map((item) => (
                <div key={item.date} className="flex items-center gap-3">
                  <span className="w-28 text-sm text-slate-500">{item.date}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-sky-500 to-emerald-400"
                      style={{ width: `${Math.min((item.revenue / 100000000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="w-28 text-right text-sm text-slate-700">{item.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
            <h2 className="text-xl font-semibold">Audience statistics</h2>
            <div className="mt-4 grid gap-3 text-sm text-slate-600">
              <p>Male: {adminStats.audience.gender_male}</p>
              <p>Female: {adminStats.audience.gender_female}</p>
              <p>Other: {adminStats.audience.gender_other}</p>
              <p>&lt;18: {adminStats.audience.age_under_18}</p>
              <p>18-25: {adminStats.audience.age_18_25}</p>
              <p>26-35: {adminStats.audience.age_26_35}</p>
              <p>36-45: {adminStats.audience.age_36_45}</p>
              <p>45+: {adminStats.audience.age_above_45}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-lg">
          <h2 className="text-xl font-semibold">Seat status by section</h2>
          <div className="mt-4 space-y-4">
            {seatStats.map((section) => (
              <div key={section.section_name}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>{section.section_name}</span>
                  <span>{section.fill_pct}% fill</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-emerald-400 to-sky-400"
                    style={{ width: `${section.fill_pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
