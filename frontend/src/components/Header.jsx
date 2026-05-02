import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { eventsApi } from '../lib/api'

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconSearch({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="9" cy="9" r="6.5" /><path d="m16 16-3-3" />
    </svg>
  )
}
function IconTicket({ className = '' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 8a2 2 0 0 0 0 4v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3a2 2 0 0 0 0-4V5a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v3Z" />
      <path d="M8 4v12" strokeDasharray="2 2" />
    </svg>
  )
}
function IconSun({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
    </svg>
  )
}
function IconMoon({ className = '' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M17 12.37A7.5 7.5 0 0 1 7.63 3 7.5 7.5 0 1 0 17 12.37Z" />
    </svg>
  )
}
function IconLogout({ className = '' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M13 3h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-4M9 14l4-4-4-4M3 10h10" />
    </svg>
  )
}
function IconUser({ className = '' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="10" cy="7" r="3.5" /><path d="M3 17a7 7 0 0 1 14 0" />
    </svg>
  )
}
function IconShield({ className = '' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M10 2L4 5v5c0 4.5 6 8 6 8s6-3.5 6-8V5L10 2Z" />
    </svg>
  )
}
function IconClock({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="10" cy="10" r="7.5" /><path d="M10 5v5l3 3" />
    </svg>
  )
}
function IconTrend({ className = '' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 14l5-5 4 4 7-9" /><path d="M14 4h4v4" />
    </svg>
  )
}

// ─── Categories ──────────────────────────────────────────────────────────────
// const CATEGORIES = ['Music', 'Sports', 'Theater', 'Comedy', 'Festival', 'Workshop', 'Tech', 'Family']

const TRENDING_QUERIES = ['Concert', 'MTP', 'Hà Nội']

// ─── SearchBox ───────────────────────────────────────────────────────────────
function SearchBox({ isDark, events = [] }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const inputRef = useRef(null)
  const boxRef = useRef(null)

  // Recent searches from localStorage
  const [recents, setRecents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tr_recent_searches') ?? '[]') } catch { return [] }
  })

  const saveRecent = useCallback((q) => {
    if (!q.trim()) return
    setRecents(prev => {
      const next = [q, ...prev.filter(r => r !== q)].slice(0, 5)
      localStorage.setItem('tr_recent_searches', JSON.stringify(next))
      return next
    })
  }, [])

  // Live suggestions from events data
  const suggestions = useMemo(() => {
    if (!value.trim() || value.length < 2) return []
    const q = value.toLowerCase()
    const matches = events
      .filter(ev => [ev.title, ev.artist, ev.venue_name].some(f => f?.toLowerCase().includes(q)))
      .slice(0, 5)
      .map(ev => ({ type: 'event', label: ev.title, sub: ev.artist ?? ev.venue_name, id: ev.id }))

    // also suggest unique artists
    const artists = [...new Set(
      events.filter(ev => ev.artist?.toLowerCase().includes(q)).map(ev => ev.artist)
    )].slice(0, 3).map(a => ({ type: 'artist', label: a }))

    return [...matches, ...artists].slice(0, 6)
  }, [value, events])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const commit = (q) => {
    const text = q ?? value
    saveRecent(text)
    setOpen(false)
    setValue(text)
    navigate(`/search?q=${encodeURIComponent(text)}`)
  }

  const handleKeyDown = (e) => {
    const items = suggestions.length ? suggestions : (value ? [] : recents.map(r => ({ label: r })))
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, items.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlighted >= 0 && items[highlighted]) commit(items[highlighted].label)
      else commit()
    }
    else if (e.key === 'Escape') { setOpen(false); inputRef.current?.blur() }
  }

  const showDropdown = open && (suggestions.length > 0 || (!value && (recents.length > 0 || TRENDING_QUERIES.length > 0)))

  return (
    <div ref={boxRef} className="relative w-full md:max-w-[440px] md:flex-1">
      {/* Input */}
      <div className={`flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 transition-all ${open
        ? isDark ? 'border-sky-600/60 bg-slate-800 shadow-lg shadow-sky-900/20' : 'border-sky-400/60 bg-white shadow-lg shadow-sky-100/60'
        : isDark ? 'border-slate-700 bg-slate-800 hover:border-slate-600' : 'border-slate-200 bg-white hover:border-slate-300'
        }`}>
        <IconSearch className={open ? (isDark ? 'text-sky-400' : 'text-sky-500') : (isDark ? 'text-slate-500' : 'text-slate-400')} />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => { setValue(e.target.value); setOpen(true); setHighlighted(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Tìm kiếm sự kiện, nghệ sĩ…"
          className={`w-full bg-transparent text-sm outline-none placeholder:text-slate-400 ${isDark ? 'text-slate-50' : 'text-slate-900'}`}
        />
        {value && (
          <button
            type="button"
            onClick={() => { setValue(''); inputRef.current?.focus() }}
            className={`shrink-0 rounded-full p-0.5 transition hover:bg-slate-200/20 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900 shadow-black/50' : 'border-slate-200 bg-white shadow-slate-200/80'
          }`}>

          {/* Live suggestions */}
          {suggestions.length > 0 ? (
            <div className="py-2">
              <p className={`px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                Gợi ý
              </p>
              {suggestions.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={() => commit(item.label)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition ${highlighted === i
                    ? isDark ? 'bg-slate-800' : 'bg-slate-50'
                    : ''
                    }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${item.type === 'artist'
                    ? isDark ? 'bg-indigo-900/60 text-indigo-400' : 'bg-indigo-50 text-indigo-500'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {item.type === 'artist' ? (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="8" cy="6" r="3" /><path d="M2 14a6 6 0 0 1 12 0" />
                      </svg>
                    ) : (
                      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" />
                      </svg>
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className={`truncate font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {item.label}
                    </p>
                    {item.sub && (
                      <p className={`truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.sub}</p>
                    )}
                  </div>
                  {item.type === 'artist' && (
                    <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      Nghệ sĩ
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              {/* Recent searches */}
              {recents.length > 0 && (
                <div className="py-2">
                  <div className={`flex items-center justify-between px-4 pb-1 pt-1`}>
                    <p className={`text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      Tìm kiếm gần đây
                    </p>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setRecents([])
                        localStorage.removeItem('tr_recent_searches')
                      }}
                      className={`text-[10px] transition hover:underline cursor-pointer ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Xóa tất cả
                    </button>
                  </div>
                  {recents.map((r, i) => (
                    <button
                      key={r}
                      type="button"
                      onMouseDown={() => commit(r)}
                      onMouseEnter={() => setHighlighted(i)}
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition cursor-pointer ${highlighted === i ? (isDark ? 'bg-slate-800' : 'bg-slate-50') : ''
                        }`}
                    >
                      <IconClock className={isDark ? 'text-slate-600' : 'text-slate-400'} />
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{r}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Trending */}
              <div className={`${recents.length ? 'border-t' : ''} py-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <p className={`px-4 pb-1 pt-1 text-[10px] font-semibold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                  Xu hướng
                </p>
                <div className="flex flex-wrap gap-2 px-4 pb-2 pt-1">
                  {TRENDING_QUERIES.map(t => (
                    <button
                      key={t}
                      type="button"
                      onMouseDown={() => commit(t)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition cursor-pointer ${isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:text-slate-900'
                        }`}
                    >
                      <IconTrend className="opacity-60" />
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const [searchParams, setSearchParams] = useSearchParams()
  const [events, setEvents] = useState([])

  const isAuthPage = ['/', '/register'].includes(location.pathname)
  const isHomePage = location.pathname === '/'
  const activeCategory = searchParams.get('category') ?? 'all'

  // Preload events for suggestions
  useEffect(() => {
    eventsApi.list().then(setEvents).catch(() => { })
  }, [])

  const updateCategory = (cat) => {
    const next = new URLSearchParams(searchParams)
    if (!cat || cat === 'all') next.delete('category')
    else next.set('category', cat)
    setSearchParams(next, { replace: true })
  }

  if (isAuthPage) return null

  return (
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-md ${isDark
      ? 'border-slate-800 bg-slate-950/85 text-slate-50'
      : 'border-slate-200/80 bg-white/85 text-slate-900'
      }`}>

      {/* ── Main bar ── */}
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-6 py-3.5 md:px-8">

        {/* Logo */}
        <Link to="/" className="shrink-0">
          <span className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
            Ticket<span className="text-sky-500">Rush</span>
          </span>
        </Link>

        {/* Search */}
        <SearchBox isDark={isDark} events={events} />

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            title={isDark ? 'Chế độ sáng' : 'Chế độ tối'}
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${isDark
              ? 'text-amber-400 hover:bg-slate-800'
              : 'text-slate-500 hover:bg-slate-100'
              }`}
          >
            {isDark ? <IconSun /> : <IconMoon />}
          </button>

          {/* My tickets */}
          <Link
            to="/tickets"
            className={`hidden items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition sm:flex ${isDark
              ? 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
          >
            <IconTicket />
            <span>Vé của tôi</span>
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5">
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${isDark
                    ? 'text-emerald-400 hover:bg-emerald-900/30'
                    : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                >
                  <IconShield />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              )}
              <Link
                to="/profile"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${isDark
                  ? 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  }`}
              >
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${isDark ? 'bg-sky-700 text-sky-200' : 'bg-sky-100 text-sky-700'
                  }`}>
                  {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                </span>
                <span className="hidden max-w-[100px] truncate md:inline">{user.full_name}</span>
              </Link>
              <button
                type="button"
                onClick={() => { logout(); navigate('/') }}
                title="Đăng xuất"
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${isDark ? 'text-slate-500 hover:bg-slate-800 hover:text-slate-300' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
                  }`}
              >
                <IconLogout />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isDark
                  ? 'text-slate-300 hover:bg-slate-800'
                  : 'text-slate-700 hover:bg-slate-100'
                  }`}
              >
                Đăng nhập
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/20 transition hover:bg-sky-400"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Category strip (home only) ── */}
      {/* {isHomePage && (
        <div className={`border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-2.5 md:px-8">
            {['all', ...CATEGORIES].map(cat => {
              const isAll = cat === 'all'
              const isActive = activeCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => updateCategory(cat)}
                  className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${isActive
                      ? isDark
                        ? 'border-sky-600/40 bg-sky-950 text-sky-300'
                        : 'border-sky-300/60 bg-sky-50 text-sky-700'
                      : isDark
                        ? 'border-transparent text-slate-500 hover:border-slate-700 hover:bg-slate-800 hover:text-slate-300'
                        : 'border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                >
                  {isAll ? 'Tất cả' : cat}
                </button>
              )
            })}
          </div>
        </div>
      )} */}
    </header>
  )
}

export default Header