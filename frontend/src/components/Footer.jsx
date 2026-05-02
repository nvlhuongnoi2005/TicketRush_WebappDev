import { useTheme } from '../context/ThemeContext.jsx'

const TEAM = [
  { name: 'Nguyen Phuoc Nguong Long', role: 'Full-stack Developer' },
  { name: 'Dinh Minh Vu', role: 'Backend Developer' },
  { name: 'Nguyen Van Lap', role: 'Frontend Developer' },
]

const LINKS = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Service', href: '/terms-of-service' },
  { label: 'Contact Us', href: '/contact-us' },
]

function Footer() {
  const { isDark } = useTheme()

  const border = isDark ? 'border-slate-800' : 'border-slate-200'
  const bg = isDark ? 'bg-slate-900' : 'bg-white'
  const muted = isDark ? 'text-slate-500' : 'text-slate-400'
  const body = isDark ? 'text-slate-400' : 'text-slate-500'
  const strong = isDark ? 'text-slate-200' : 'text-slate-700'
  const hover = isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
  const divider = isDark ? 'bg-slate-800' : 'bg-slate-100'

  return (
    <footer className={`mt-auto w-full border-t ${border} ${bg}`}>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">

        {/* ── Top row ── */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white shadow-sm">
                T
              </div>
              <span className={`text-lg font-extrabold tracking-tight ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                Ticket<span className="text-sky-500">Rush</span>
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${body}`}>
              Electronic ticket distribution platform for music &amp; entertainment events - featuring visual seating, real-time sales, and audience analytics.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>Quick links</p>
            <div className="space-y-2">
              {LINKS.map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${body} ${hover}`}
                >
                  <span className="opacity-40">›</span>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Built by */}
          <div className="space-y-3">
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>Built by</p>
            <div className="space-y-2.5">
              {TEAM.map(({ name, role }) => (
                <div key={name} className="flex items-center gap-2.5">
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${strong}`}>{name}</p>
                    <p className={`text-xs ${muted}`}>{role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className={`my-7 h-px w-full ${divider}`} />

        {/* ── Bottom row ── */}
        <div className="flex flex-col items-center justify-between gap-3 text-xs sm:flex-row">
          <p className={muted}>
            &copy; {new Date().getFullYear()} TicketRush. All rights reserved.
          </p>
          <div className={`flex items-center gap-1 ${muted}`}>
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            All systems operational
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer