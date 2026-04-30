import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { adminApi } from '../lib/api'

// ─── Donut chart for gender ────────────────────────────────────────────────────

function DonutChart({ slices, isDark }) {
  const total = slices.reduce((s, x) => s + x.value, 0)
  if (!total) return <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu.</p>

  const CX = 90, CY = 90, R = 70, ri = 42
  const holeColor = isDark ? '#1e293b' : '#ffffff'
  const nonZero = slices.filter((s) => s.value > 0)

  // Full-ring shortcut when only one slice has data
  if (nonZero.length === 1) {
    const s = nonZero[0]
    return (
      <div className="mt-4 flex flex-wrap items-center gap-6">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <circle cx={CX} cy={CY} r={R} fill={s.color} />
          <circle cx={CX} cy={CY} r={ri} fill={holeColor} />
        </svg>
        <Legend slices={slices} total={total} isDark={isDark} />
      </div>
    )
  }

  let angle = -Math.PI / 2
  const paths = []

  for (const slice of slices) {
    if (slice.value === 0) continue
    const pct = slice.value / total
    const sweep = pct * 2 * Math.PI
    const endAngle = angle + sweep

    const x1 = CX + R * Math.cos(angle)
    const y1 = CY + R * Math.sin(angle)
    const x2 = CX + R * Math.cos(endAngle)
    const y2 = CY + R * Math.sin(endAngle)
    const xi1 = CX + ri * Math.cos(angle)
    const yi1 = CY + ri * Math.sin(angle)
    const xi2 = CX + ri * Math.cos(endAngle)
    const yi2 = CY + ri * Math.sin(endAngle)

    const large = pct > 0.5 ? 1 : 0

    paths.push({
      d: `M${f(x1)} ${f(y1)} A${R} ${R} 0 ${large} 1 ${f(x2)} ${f(y2)} L${f(xi2)} ${f(yi2)} A${ri} ${ri} 0 ${large} 0 ${f(xi1)} ${f(yi1)} Z`,
      color: slice.color,
      label: slice.label,
      value: slice.value,
      pct: Math.round(pct * 100),
    })
    angle = endAngle
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180">
        {paths.map((p, i) => (
          <path key={i} d={p.d} fill={p.color} />
        ))}
      </svg>
      <Legend slices={slices} total={total} isDark={isDark} />
    </div>
  )
}

function f(n) { return n.toFixed(2) }

function Legend({ slices, total, isDark }) {
  const textCls = isDark ? 'text-slate-300' : 'text-slate-700'
  return (
    <div className="space-y-2 text-sm">
      {slices.map((s, i) => {
        const pct = total ? Math.round((s.value / total) * 100) : 0
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className={textCls}>
              {s.label}:{' '}
              <span className="font-semibold">{s.value}</span>
              <span className="ml-1 text-slate-400">({pct}%)</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Horizontal bar chart for age ─────────────────────────────────────────────

function BarChart({ bars, isDark }) {
  const max = Math.max(...bars.map((b) => b.value), 1)
  const trackCls = isDark ? 'bg-slate-700' : 'bg-slate-200'
  const labelCls = isDark ? 'text-slate-400' : 'text-slate-500'
  const valueCls = isDark ? 'text-slate-200' : 'text-slate-800'
  return (
    <div className="mt-4 space-y-3">
      {bars.map((bar) => (
        <div key={bar.label} className="flex items-center gap-3">
          <span className={`w-14 shrink-0 text-right text-xs ${labelCls}`}>{bar.label}</span>
          <div className={`h-3 flex-1 overflow-hidden rounded-full ${trackCls}`}>
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400 transition-all duration-500"
              style={{ width: `${(bar.value / max) * 100}%` }}
            />
          </div>
          <span className={`w-8 shrink-0 text-right text-xs font-semibold ${valueCls}`}>
            {bar.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main dashboard ────────────────────────────────────────────────────────────

function AdminDashboard() {
  const { isDark } = useTheme()
  const { user, authLoading } = useAuth()
  const navigate = useNavigate()
  const [dashboard, setDashboard] = useState(null)
  const [events, setEvents] = useState([])
  const [seatStats, setSeatStats] = useState([])
  const [audience, setAudience] = useState(null)
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'admin') {
      navigate('/login', { replace: true })
    }
  }, [user, authLoading, navigate])

  // Initial load + auto-refresh every 10s
  useEffect(() => {
    let first = true

    const fetchAll = () => {
      Promise.all([
        adminApi.dashboard(),
        adminApi.events.list(),
        adminApi.stats.audience(),
      ])
        .then(([dash, evts, aud]) => {
          setDashboard(dash)
          setEvents(evts)
          setAudience(aud)
          // Only set selected event on first load or if current selection gone
          setSelectedEventId((prev) => {
            if (prev && evts.some((e) => e.id === prev)) return prev
            return evts[0]?.id ?? null
          })
        })
        .catch(console.error)
        .finally(() => {
          if (first) { setLoading(false); first = false }
        })
    }

    fetchAll()
    const iv = setInterval(fetchAll, 10000)
    return () => clearInterval(iv)
  }, [])

  // Seat stats fetch + auto-refresh when selected event changes
  useEffect(() => {
    if (!selectedEventId) return

    const fetchSeats = () =>
      adminApi.stats.seats(selectedEventId).then(setSeatStats).catch(console.error)

    fetchSeats()
    const iv = setInterval(fetchSeats, 10000)
    return () => clearInterval(iv)
  }, [selectedEventId])

  const kpis = dashboard
    ? [
        { label: 'Tổng sự kiện', value: dashboard.total_events },
        { label: 'Đang mở bán', value: dashboard.active_events },
        { label: 'Vé đã bán', value: Number(dashboard.total_tickets_sold).toLocaleString() },
        { label: 'Doanh thu', value: `${Number(dashboard.total_revenue).toLocaleString()} ₫` },
      ]
    : []

  const genderSlices = audience
    ? [
        { label: 'Nam', value: audience.gender_male, color: '#38bdf8' },
        { label: 'Nữ', value: audience.gender_female, color: '#f472b6' },
        { label: 'Khác', value: audience.gender_other, color: '#a78bfa' },
      ]
    : []

  const ageBars = audience
    ? [
        { label: '<18', value: audience.age_under_18 },
        { label: '18-25', value: audience.age_18_25 },
        { label: '26-35', value: audience.age_26_35 },
        { label: '36-45', value: audience.age_36_45 },
        { label: '45+', value: audience.age_above_45 },
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
            <Link
              to="/admin/events/create"
              className="rounded-full bg-sky-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
            >
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
          {/* Revenue chart – 7-day bar */}
          <div className={card}>
            <h2 className="text-xl font-semibold">Doanh thu 7 ngày gần nhất</h2>
            {dashboard?.recent_revenue?.length ? (
              <div className="mt-4 space-y-3">
                {dashboard.recent_revenue.map((item) => {
                  const max = Math.max(...dashboard.recent_revenue.map((r) => r.revenue), 1)
                  return (
                    <div key={item.date} className="flex items-center gap-3">
                      <span className={`w-24 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.date}
                      </span>
                      <div className={`h-3 flex-1 overflow-hidden rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
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

          {/* Audience – gender donut + age bar */}
          <div className={card}>
            <h2 className="text-xl font-semibold">Thống kê khán giả</h2>
            {audience ? (
              <div className="mt-2 grid gap-6 sm:grid-cols-2">
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Giới tính
                  </p>
                  <DonutChart slices={genderSlices} isDark={isDark} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Độ tuổi
                  </p>
                  <BarChart bars={ageBars} isDark={isDark} />
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">Chưa có dữ liệu.</p>
            )}
          </div>
        </div>

        {/* Seat fill stats */}
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
                    <div
                      className="h-full bg-rose-400 transition-all duration-500"
                      style={{ width: `${(sec.sold / sec.total) * 100}%` }}
                      title="Sold"
                    />
                    <div
                      className="h-full bg-amber-400 transition-all duration-500"
                      style={{ width: `${(sec.locked / sec.total) * 100}%` }}
                      title="Locked"
                    />
                    <div
                      className="h-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${(sec.available / sec.total) * 100}%` }}
                      title="Available"
                    />
                  </div>
                </div>
              ))}
              <div className="flex gap-4 text-xs text-slate-400">
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-rose-400" />Đã bán</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-amber-400" />Đang giữ</span>
                <span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-400" />Còn trống</span>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default AdminDashboard
