import { useMemo } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { FaSearch, FaTag, FaMoon, FaSun } from 'react-icons/fa'
import { categories } from '../data/mockData'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, logout } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'
  const isHomePage = location.pathname === '/'
  const search = searchParams.get('q') ?? ''
  const activeCategory = searchParams.get('category') ?? 'all'

  const activeCategoryLabel = useMemo(() => {
    return activeCategory === 'all' ? 'All events' : activeCategory
  }, [activeCategory])

  const updateSearchParams = (nextValues) => {
    const nextParams = new URLSearchParams(searchParams)

    Object.entries(nextValues).forEach(([key, value]) => {
      if (!value || value === 'all') {
        nextParams.delete(key)
      } else {
        nextParams.set(key, value)
      }
    })

    setSearchParams(nextParams, { replace: true })
  }

  if (isAuthPage) {
    return null
  }

  return (
    <header className={`w-full sticky top-0 z-50 border-b ${isDark ? 'border-slate-800 bg-slate-900/90 text-slate-50' : 'border-slate-200 bg-white/90 text-slate-900'} text-sm shadow-sm backdrop-blur`}>
      <div className="px-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className={`cursor-pointer text-2xl font-bold tracking-tight ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>TicketRush</span>
          </Link>

          <div className="relative w-full md:max-w-105 md:flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => updateSearchParams({ q: e.target.value })}
              placeholder="Search events or artists..."
              className={`w-full rounded-full border px-11 py-3 text-sm outline-none placeholder:text-slate-400 transition ${isDark ? 'border-slate-700 bg-slate-800 text-slate-50 focus:border-sky-500/60' : 'border-slate-200 bg-white text-slate-900 focus:border-sky-400/60'}`}
            />
            <FaSearch className={`absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className={`inline-flex items-center rounded-full px-3 py-2 transition ${isDark ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              {isDark ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
            </button>

            <Link
              to="/tickets"
              className="inline-flex items-center gap-2 rounded-full bg-sky-500 px-4 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-400"
            >
              <FaTag className="text-sm" />
              <span>My tickets</span>
            </Link>

            {user ? (
              <>
                <div className={`rounded-full px-4 py-2 font-medium ${isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-900'}`}>
                  Hi, {user.full_name}
                </div>
                {user.role === 'admin' && (
                  <Link to="/admin" className={`rounded-full px-4 py-2 font-medium transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}>
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className={`rounded-full px-4 py-2 font-medium transition ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full bg-rose-500 px-4 py-2 font-medium text-white transition hover:bg-rose-400">
                  Login
                </Link>
                <Link to="/register" className="rounded-full bg-sky-500 px-4 py-2 font-medium text-white transition hover:bg-sky-400">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {isHomePage && (
        <div className={`border-t px-4 md:px-8 ${isDark ? 'border-slate-800 bg-slate-800' : 'border-slate-200 bg-slate-50'}`}>
          <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto py-3">
            <button
              type="button"
              onClick={() => updateSearchParams({ category: 'all' })}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${activeCategory === 'all' ? (isDark ? 'border-sky-500/40 bg-sky-900 text-sky-300' : 'border-sky-400/40 bg-sky-100 text-sky-700') : (isDark ? 'border-slate-700 bg-slate-700 text-slate-300 hover:bg-slate-600' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100')}`}
            >
              All events
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => updateSearchParams({ category })}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${activeCategory === category ? (isDark ? 'border-sky-500/40 bg-sky-900 text-sky-300' : 'border-sky-400/40 bg-sky-100 text-sky-700') : (isDark ? 'border-slate-700 bg-slate-700 text-slate-300 hover:bg-slate-600' : 'border-slate-200 bg-white text-slate-900 hover:bg-slate-100')}`}
              >
                {category}
              </button>
            ))}
            <div className={`ml-auto whitespace-nowrap text-xs uppercase tracking-[0.2em] ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
              {activeCategoryLabel}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
