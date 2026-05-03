import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { eventsApi } from '../lib/api'

// ─── Animations ───────────────────────────────────────────────────────────────
const SEARCH_CSS = `
@keyframes srchDropdownIn {
  from { opacity: 0; transform: translateY(-8px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes srchFadeUp {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes srchShimmer {
  0%, 100% { background-position: 0% 50%; }
  50%       { background-position: 100% 50%; }
}
.srch-dropdown-in { animation: srchDropdownIn 0.2s cubic-bezier(.22,1,.36,1) both; }
.srch-fade-up     { animation: srchFadeUp 0.25s cubic-bezier(.22,1,.36,1) both; }
.srch-shimmer-bg  {
  background: linear-gradient(110deg, #0ea5e9 0%, #6366f1 50%, #a855f7 100%);
  background-size: 200% 200%;
  animation: srchShimmer 6s ease infinite;
}
`

// ─── Icons ───────────────────────────────────────────────────────────────────
function IconSearch({ className = '', size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
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
function IconShield({ className = '' }) {
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M10 2L4 5v5c0 4.5 6 8 6 8s6-3.5 6-8V5L10 2Z" />
    </svg>
  )
}
function IconClock({ className = '' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <circle cx="10" cy="10" r="7.5" /><path d="M10 5v5l3 3" />
    </svg>
  )
}
function IconTrend({ className = '' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M2 14l5-5 4 4 7-9" /><path d="M14 4h4v4" />
    </svg>
  )
}
function IconClose({ size = 12 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M2 2l10 10M12 2L2 12" />
    </svg>
  )
}
function IconArtist() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="6" r="3" /><path d="M2 14a6 6 0 0 1 12 0" />
    </svg>
  )
}
function IconEvent() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M2 6a2 2 0 0 0 0 4v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2a2 2 0 0 0 0-4V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2Z" />
    </svg>
  )
}

// ─── Trending queries ─────────────────────────────────────────────────────────
const TRENDING_QUERIES = ['Concert', 'MTP', 'TP.HCM']

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
      .slice(0, 4)
      .map(ev => ({ type: 'event', label: ev.title, sub: ev.artist ?? ev.venue_name, id: ev.id, banner: ev.banner_url }))

    const artists = [...new Set(
      events.filter(ev => ev.artist?.toLowerCase().includes(q)).map(ev => ev.artist)
    )].slice(0, 2).map(a => ({ type: 'artist', label: a }))

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

  // Label shown in trigger when closed and has value
  const hasValue = value.trim().length > 0

  return (
    <>
      <style>{SEARCH_CSS}</style>
      <div ref={boxRef} className="relative w-full md:max-w-[480px] md:flex-1">

        {/* ── Trigger button / input hybrid ── */}
        <button
          type="button"
          onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 10) }}
          className={`group flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition-all duration-200 ${open
            ? isDark
              ? 'border-sky-500/60 shadow-lg shadow-sky-900/20'
              : 'border-sky-400/60 shadow-lg shadow-sky-100/80'
            : 'hover:-translate-y-px hover:shadow-md'
            } ${hasValue && !open
              ? isDark
                ? 'border-indigo-500/50 bg-gradient-to-r from-sky-500/10 to-indigo-500/10'
                : 'border-indigo-400/40 bg-gradient-to-r from-sky-50 to-indigo-50'
              : isDark
                ? 'border-slate-700 bg-slate-800/80 hover:border-slate-600'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
        >
          {/* Search icon — gradient when active/has value */}
          <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all ${open || hasValue
            ? 'srch-shimmer-bg text-white shadow-sm'
            : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'
            }`}>
            <IconSearch size={13} />
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setOpen(true); setHighlighted(-1) }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Tìm kiếm sự kiện, nghệ sĩ…"
            className={`w-full bg-transparent text-sm outline-none ${isDark ? 'text-slate-50 placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'
              }`}
          />

          {/* Right side: clear btn or hint */}
          {value ? (
            <button
              type="button"
              onMouseDown={e => { e.stopPropagation(); setValue(''); inputRef.current?.focus() }}
              className={`shrink-0 flex h-5 w-5 items-center justify-center rounded-full transition ${isDark ? 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200' : 'bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-700'
                }`}
            >
              <IconClose />
            </button>
          ) : (
            <kbd className={`hidden shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold sm:block ${isDark ? 'border-slate-700 bg-slate-900 text-slate-600' : 'border-slate-200 bg-slate-50 text-slate-400'
              }`}>
              /
            </kbd>
          )}
        </button>

        {/* ── Dropdown ── */}
        {showDropdown && (
          <div className={`srch-dropdown-in absolute left-0 right-0 top-[calc(100%+10px)] z-[60] overflow-hidden rounded-2xl border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900 shadow-black/60' : 'border-slate-200 bg-white shadow-slate-300/40'
            }`}>

            {/* Live suggestions */}
            {suggestions.length > 0 ? (
              <div className="py-2">
                {/* Section header */}
                <div className={`mx-3 mb-1.5 mt-1 flex items-center gap-2`}>
                  <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                    Gợi ý
                  </p>
                  <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                </div>

                {suggestions.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={() => commit(item.label)}
                    onMouseEnter={() => setHighlighted(i)}
                    className={`srch-fade-up flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${highlighted === i
                      ? isDark ? 'bg-slate-800' : 'bg-slate-50'
                      : ''
                      }`}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    {/* Thumbnail or icon */}
                    <div className={`relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl ${item.type === 'artist'
                      ? isDark ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-50 text-indigo-500'
                      : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {item.type === 'event' && item.banner ? (
                        <img src={item.banner} alt="" className="h-full w-full object-cover" />
                      ) : item.type === 'artist' ? (
                        <IconArtist />
                      ) : (
                        <IconEvent />
                      )}
                    </div>

                    {/* Text */}
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                        {item.label}
                      </p>
                      {item.sub && (
                        <p className={`truncate text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.sub}</p>
                      )}
                    </div>

                    {/* Badge */}
                    {item.type === 'artist' ? (
                      <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-indigo-900/60 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                        Nghệ sĩ
                      </span>
                    ) : (
                      <span className={`ml-auto shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${isDark ? 'bg-sky-900/60 text-sky-400' : 'bg-sky-50 text-sky-600'
                        }`}>
                        Sự kiện
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-2">
                {/* Recent searches */}
                {recents.length > 0 && (
                  <>
                    <div className={`mx-3 mb-1.5 mt-1 flex items-center justify-between`}>
                      <div className={`flex items-center gap-2 flex-1`}>
                        <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                        <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                          Tìm kiếm gần đây
                        </p>
                        <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                      </div>
                      <button
                        type="button"
                        onMouseDown={() => {
                          setRecents([])
                          localStorage.removeItem('tr_recent_searches')
                        }}
                        className={`ml-3 shrink-0 text-[10px] font-semibold transition hover:underline ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600'
                          }`}
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
                        className={`srch-fade-up flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${highlighted === i ? (isDark ? 'bg-slate-800' : 'bg-slate-50') : ''
                          }`}
                        style={{ animationDelay: `${i * 30}ms` }}
                      >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
                          }`}>
                          <IconClock />
                        </div>
                        <span className={`flex-1 truncate text-sm font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r}</span>
                        <span className={`text-[10px] ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>↵</span>
                      </button>
                    ))}

                    <div className={`mx-3 my-2 h-px ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  </>
                )}

                {/* Trending */}
                <div className="px-3 pb-2">
                  <div className={`mb-2 flex items-center gap-2`}>
                    <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                    <p className={`text-[10px] font-bold uppercase tracking-[0.18em] ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>
                      Xu hướng
                    </p>
                    <div className={`h-px flex-1 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {TRENDING_QUERIES.map((t, i) => (
                      <button
                        key={t}
                        type="button"
                        onMouseDown={() => commit(t)}
                        className={`srch-fade-up inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:-translate-y-0.5 hover:shadow-sm ${isDark
                          ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-sky-500/50 hover:bg-sky-500/10 hover:text-sky-400'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-sky-400/50 hover:bg-sky-50 hover:text-sky-600'
                          }`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <IconTrend className="opacity-60" />
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer hint */}
            <div className={`border-t px-4 py-2 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <p className={`text-[10px] ${isDark ? 'text-slate-700' : 'text-slate-300'}`}>
                <kbd className={`rounded px-1 py-0.5 text-[9px] ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>↑↓</kbd>{' '}
                điều hướng &nbsp;·&nbsp;{' '}
                <kbd className={`rounded px-1 py-0.5 text-[9px] ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>↵</kbd>{' '}
                chọn &nbsp;·&nbsp;{' '}
                <kbd className={`rounded px-1 py-0.5 text-[9px] ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>Esc</kbd>{' '}
                đóng
              </p>
            </div>
          </div>
        )}
      </div>
    </>
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

  // Preload events for suggestions
  useEffect(() => {
    eventsApi.list().then(setEvents).catch(() => { })
  }, [])

  if (isAuthPage) return null

  return (
    <header className={`sticky top-0 z-60 w-full border-b backdrop-blur-md ${isDark
      ? 'border-slate-800 bg-slate-950/85 text-slate-50'
      : 'border-slate-200/80 bg-white/85 text-slate-900'
      }`}>
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
            className={`flex h-9 w-9 items-center justify-center rounded-xl transition cursor-pointer ${isDark ? 'text-amber-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
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
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition ${isDark ? 'text-emerald-400 hover:bg-emerald-900/30' : 'text-emerald-700 hover:bg-emerald-50'
                    }`}
                >
                  <IconShield />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              )}
              <Link
                to="/profile"
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
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
                className={`rounded-xl px-4 py-2 text-sm font-medium transition ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-100'
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
    </header>
  )
}

export default Header