import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../lib/api'

function AdminDashboard() {
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [seatStats, setSeatStats] = useState([])
  const [audience, setAudience] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([adminApi.dashboard(), adminApi.events.list(), adminApi.stats.audience()])
      .then(([dash, evList, aud]) => {
        setDashboard(dash)
        setEvents(evList)
        setAudience(aud)
        if (evList.length > 0) setSelectedEventId(evList[0].id)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedEventId) return
    adminApi.stats.seats(selectedEventId)
      .then(setSeatStats)
      .catch(console.error)
  }, [selectedEventId])

  const kpis = dashboard
    ? [
        { label: 'Total events', value: dashboard.total_events },
        { label: 'Active events', value: dashboard.active_events },
        { label: 'Tickets sold', value: dashboard.total_tickets_sold?.toLocaleString() },
        { label: 'Revenue', value: `${(dashboard.total_revenue || 0).toLocaleString()} VND` },
      ]
    : []

  return (
    <div className="bg-slate-950 text-white">
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Admin dashboard</p>
            <h1 className="text-3xl font-semibold">Real-time overview</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/events/create" className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
              Create event
            </Link>
            <Link to="/admin/events" className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
              Manage events
            </Link>
            {events.length > 0 && (
              <select
                value={selectedEventId || ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white outline-none"
              >
                {events.map((event) => (
                  <option key={event.id} value={event.id} className="bg-slate-900">
                    {event.title}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Loading dashboard...</div>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <p className="text-sm text-slate-400">{kpi.label}</p>
                  <p className="mt-2 text-3xl font-semibold text-cyan-300">{kpi.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {dashboard?.recent_revenue?.length > 0 && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xl font-semibold">Revenue - last 7 days</h2>
                  <div className="mt-4 space-y-3">
                    {dashboard.recent_revenue.map((item) => (
                      <div key={item.date} className="flex items-center gap-3">
                        <span className="w-28 text-sm text-slate-400">{item.date}</span>
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-linear-to-r from-cyan-400 to-emerald-400"
                            style={{ width: `${Math.min((item.revenue / 100000000) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="w-28 text-right text-sm text-slate-200">{item.revenue.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {audience && (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <h2 className="text-xl font-semibold">Audience statistics</h2>
                  <div className="mt-4 grid gap-3 text-sm text-slate-300">
                    <p>Male: {audience.gender_male}</p>
                    <p>Female: {audience.gender_female}</p>
                    <p>Other: {audience.gender_other}</p>
                    <p>&lt;18: {audience.age_under_18}</p>
                    <p>18-25: {audience.age_18_25}</p>
                    <p>26-35: {audience.age_26_35}</p>
                    <p>36-45: {audience.age_36_45}</p>
                    <p>45+: {audience.age_above_45}</p>
                  </div>
                </div>
              )}
            </div>

            {seatStats.length > 0 && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
                <h2 className="text-xl font-semibold">Seat status by section</h2>
                <div className="mt-4 space-y-4">
                  {seatStats.map((section) => (
                    <div key={section.section_name}>
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span>{section.section_name}</span>
                        <span>{section.fill_pct}% fill ({section.sold}/{section.total} sold)</span>
                      </div>
                      <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-linear-to-r from-emerald-400 to-cyan-400"
                          style={{ width: `${section.fill_pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}

export default AdminDashboard
