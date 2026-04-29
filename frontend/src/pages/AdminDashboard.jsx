import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { adminApi } from '../lib/api'

function AdminDashboard() {
  const { isDark } = useTheme()
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [seatStats, setSeatStats] = useState([])
  const [audience, setAudience] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      adminApi.dashboard(),
      adminApi.events.list(),
      adminApi.stats.audience(),
    ]).then(([dash, evts, aud]) => {
      setDashboard(dash)
      setEvents(evts)
      setAudience(aud)
      if (evts.length) setSelectedEventId(evts[0].id)
    }).catch(console.error)
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
        { label: 'Tổng sự kiện', value: dashboard.total_events },
        { label: 'Đang mở bán', value: dashboard.active_events },
        { label: 'Vé đã bán', value: Number(dashboard.total_tickets_sold).toLocaleString() },
        { label: 'Doanh thu', value: `${Number(dashboard.total_revenue).toLocaleString()} ₫` },
      ]
    : []

  const card = `rounded-3xl border p-5 shadow-lg ${isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`

  if (loading) {
    return (
      <div className={`${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
        <div className="py-16 text-center text-slate-400">Đang tải dashboard...</div>
      </div>
    )
  }

  return (
    <div className={`${isDark ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-sky-600">Admin dashboard</p>
            <h1 className="text-3xl font-semibold">Tổng quan hệ thống</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/admin/events/create" className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
              Tạo sự kiện
            </Link>
            <Link
              to="/admin/events"
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${isDark ? 'border-slate-700 text-slate-50 hover:bg-slate-800' : 'border-slate-200 text-slate-900 hover:bg-slate-100'}`}
            >
              Quản lý sự kiện
            </Link>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => (
            <div key={kpi.label} className={card}>
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.label}</p>
              <p className="mt-2 text-3xl font-semibold text-sky-500">{kpi.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Revenue chart */}
          <div className={card}>
            <h2 className="text-xl font-semibold">Doanh thu 7 ngày gần nhất</h2>
            {dashboard?.recent_revenue?.length ? (
              <div className="mt-4 space-y-3">
                {dashboard.recent_revenue.map((item) => {
                  const max = Math.max(...dashboard.recent_revenue.map((r) => r.revenue), 1)
                  return (
                    <div key={item.date} className="flex items-center gap-3">
                      <span className={`w-24 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.date}</span>
                      <div className={`h-3 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400"
                          style={{ width: `${Math.min((item.revenue / max) * 100, 100)}%` }}
                        />
                      </div>
                      <span className={`w-28 text-right text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {Number(item.revenue).toLocaleString()} ₫
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu doanh thu.</p>
            )}
          </div>

          {/* Audience */}
          <div className={card}>
            <h2 className="text-xl font-semibold">Thống kê khán giả</h2>
            {audience ? (
              <div className={`mt-4 grid grid-cols-2 gap-3 text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                <div className="space-y-1">
                  <p className="font-medium text-slate-400">Giới tính</p>
                  <p>Nam: <span className="font-medium text-white">{audience.gender_male}</span></p>
                  <p>Nữ: <span className="font-medium text-white">{audience.gender_female}</span></p>
                  <p>Khác: <span className="font-medium text-white">{audience.gender_other}</span></p>
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-slate-400">Độ tuổi</p>
                  <p>&lt;18: <span className="font-medium text-white">{audience.age_under_18}</span></p>
                  <p>18-25: <span className="font-medium text-white">{audience.age_18_25}</span></p>
                  <p>26-35: <span className="font-medium text-white">{audience.age_26_35}</span></p>
                  <p>36-45: <span className="font-medium text-white">{audience.age_36_45}</span></p>
                  <p>45+: <span className="font-medium text-white">{audience.age_above_45}</span></p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu.</p>
            )}
          </div>
        </div>

        {/* Seat stats */}
        <div className={`mt-6 ${card}`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">Tình trạng ghế theo khu vực</h2>
            {events.length > 0 && (
              <select
                value={selectedEventId ?? ''}
                onChange={(e) => setSelectedEventId(Number(e.target.value))}
                className={`rounded-full border px-4 py-2 text-sm outline-none ${isDark ? 'border-slate-700 bg-slate-700 text-white' : 'border-slate-200 bg-white text-slate-900'}`}
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            )}
          </div>
          {seatStats.length === 0 ? (
            <p className="text-sm text-slate-400">Chưa có dữ liệu ghế.</p>
          ) : (
            <div className="space-y-4">
              {seatStats.map((sec) => (
                <div key={sec.section_name}>
                  <div className={`mb-2 flex items-center justify-between text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    <span>{sec.section_name}</span>
                    <span className="text-xs text-slate-400">
                      {sec.sold} sold · {sec.locked} locked · {sec.available} available · {sec.fill_pct}% fill
                    </span>
                  </div>
                  <div className={`flex h-3 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div className="h-full bg-rose-400" style={{ width: `${(sec.sold / sec.total) * 100}%` }} title="Sold" />
                    <div className="h-full bg-amber-400" style={{ width: `${(sec.locked / sec.total) * 100}%` }} title="Locked" />
                    <div className="h-full bg-emerald-400" style={{ width: `${(sec.available / sec.total) * 100}%` }} title="Available" />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-slate-400">
                <span><span className="inline-block h-2 w-2 rounded-full bg-rose-400 mr-1" />Đã bán</span>
                <span><span className="inline-block h-2 w-2 rounded-full bg-amber-400 mr-1" />Đang giữ</span>
                <span><span className="inline-block h-2 w-2 rounded-full bg-emerald-400 mr-1" />Còn trống</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
