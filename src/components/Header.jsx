import { useMemo } from 'react'
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { FaSearch, FaTag } from 'react-icons/fa'
import { categories } from '../data/mockData'
import { useAuth } from '../context/AuthContext.jsx'

function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, logout } = useAuth()
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
    <header className="w-full border-b border-white/10 bg-slate-950/95 text-sm text-white backdrop-blur">
      <div className="px-4 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="cursor-pointer text-2xl font-bold tracking-tight text-white">TicketRush</span>
          </Link>

          <div className="relative w-full md:max-w-105 md:flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => updateSearchParams({ q: e.target.value })}
              placeholder="Search events or artists..."
              className="w-full rounded-full border border-white/10 bg-white/5 px-11 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/40"
            />
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500" />
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/tickets"
              className="inline-flex items-center gap-2 rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950 shadow-sm transition hover:bg-cyan-300"
            >
              <FaTag className="text-sm" />
              <span>My tickets</span>
            </Link>

            {user ? (
              <>
                <div className="rounded-full bg-white/10 px-4 py-2 font-medium text-white">
                  Hi, {user.full_name}
                </div>
                {user.role === 'admin' && (
                  <Link to="/admin" className="rounded-full bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/15">
                    Admin
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout()
                    navigate('/')
                  }}
                  className="rounded-full bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/15"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-full bg-rose-400 px-4 py-2 font-medium text-white transition hover:bg-rose-500">
                  Login
                </Link>
                <Link to="/register" className="rounded-full bg-sky-400 px-4 py-2 font-medium text-slate-950 transition hover:bg-sky-300">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {isHomePage && (
        <div className="border-t border-white/10 bg-slate-900/80 px-4 md:px-8">
          <div className="mx-auto flex max-w-7xl items-center gap-3 overflow-x-auto py-3 text-white">
            <button
              type="button"
              onClick={() => updateSearchParams({ category: 'all' })}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${activeCategory === 'all' ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200' : 'border-white/20 bg-white/5 hover:bg-white/15'}`}
            >
              All events
            </button>
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => updateSearchParams({ category })}
                className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${activeCategory === category ? 'border-cyan-400/40 bg-cyan-400/15 text-cyan-200' : 'border-white/20 bg-white/5 hover:bg-white/15'}`}
              >
                {category}
              </button>
            ))}
            <div className="ml-auto whitespace-nowrap text-xs uppercase tracking-[0.2em] text-slate-400">
              {activeCategoryLabel}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export default Header
