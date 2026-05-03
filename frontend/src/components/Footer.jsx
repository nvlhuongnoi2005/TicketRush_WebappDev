import { useTheme } from '../context/ThemeContext.jsx'

const TEAM = [
  {
    name: 'Nguyễn Phước Nguỡng Long',
    role: 'Full-stack developer',
    avatar: '/avatar/longnpn.jpg',
    socials: {
      github: 'https://github.com/NPNLong',
      linkedin: 'https://www.linkedin.com/in/nguyen-phuoc-nguong-long-714303335/',
      facebook: 'https://web.facebook.com/LongNpn/?locale=vi_VN',
    },
  },
  {
    name: 'Đinh Minh Vũ',
    role: 'Backend developer',
    avatar: '/avatar/vudm.jpg',
    socials: {
      github: 'https://github.com/minhvudinh23',
      linkedin: 'https://www.linkedin.com/in/nguyen-phuoc-nguong-long-714303335/',
      facebook: 'https://web.facebook.com/vu.inh.266145?locale=vi_VN',
    },
  },
  {
    name: 'Nguyễn Văn Lập',
    role: 'Frontend developer',
    avatar: '/avatar/lapnv.jpg',
    socials: {
      github: 'https://github.com/nvlhuongnoi2005',
      linkedin: 'https://www.linkedin.com/in/nguyen-phuoc-nguong-long-714303335/',
      facebook: 'https://web.facebook.com/nvlhuongnoi?locale=vi_VN',
    },
  },
]

const LINKS = [
  { label: 'Chính sách bảo mật', href: '/privacy-policy' },
  { label: 'Điều khoản dịch vụ', href: '/terms-of-service' },
  { label: 'Liên hệ', href: '/contact-us' },
]

// Social icons (inline SVG để không phải cài thêm thư viện)
const SocialIcon = {
  github: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
}

function Footer() {
  const { isDark } = useTheme()

  const border = isDark ? 'border-slate-800' : 'border-slate-200'
  const bg = isDark ? 'bg-slate-900' : 'bg-white'
  const muted = isDark ? 'text-slate-500' : 'text-slate-400'
  const body = isDark ? 'text-slate-400' : 'text-slate-500'
  const strong = isDark ? 'text-slate-200' : 'text-slate-700'
  const hover = isDark ? 'hover:text-slate-200' : 'hover:text-slate-800'
  const divider = isDark ? 'bg-slate-800' : 'bg-slate-100'

  // Social icon hover colors theo brand mỗi nền tảng
  const socialClass = (platform) => {
    const base = `flex h-6 w-6 items-center justify-center rounded-md transition-all hover:-translate-y-0.5 ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'
      }`
    const hoverMap = {
      github: isDark ? 'hover:bg-slate-700 hover:text-white' : 'hover:bg-slate-900 hover:text-white',
      linkedin: 'hover:bg-[#0A66C2] hover:text-white',
      facebook: 'hover:bg-[#1877F2] hover:text-white',
    }
    return `${base} ${hoverMap[platform] || ''}`
  }

  return (
    <footer className={`mt-auto w-full border-t ${border} ${bg}`}>
      <div className="mx-auto max-w-7xl px-6 py-10 md:px-8">

        {/* ── Top row ── */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-12">

          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg shadow-sm">
                <img src="/ticketrush.png" alt="TicketRush" className="h-full w-full object-contain" />
              </div>
              <span className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-slate-50' : 'text-slate-900'}`}>
                Ticket<span className="text-sky-500">Rush</span>
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${body}`}>
              Nền tảng phân phối vé điện tử cho các sự kiện âm nhạc &amp; giải trí - sơ đồ chỗ ngồi trực quan, bán vé thời gian thực và phân tích khán giả thông minh.
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>Liên kết nhanh</p>
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
            <p className={`text-xs font-semibold uppercase tracking-widest ${muted}`}>Đội ngũ phát triển</p>
            <div className="space-y-3">
              {TEAM.map(({ name, role, avatar, socials }) => (
                <div key={name} className="flex items-center gap-2.5">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-bold ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {avatar ? (
                      <img src={avatar} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      name.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-xs font-semibold ${strong}`}>{name}</p>
                    <p className={`text-[11px] ${muted}`}>{role}</p>
                  </div>
                  {socials && (
                    <div className="flex shrink-0 items-center gap-1">
                      {socials.github && (
                        <a
                          href={socials.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`GitHub của ${name}`}
                          className={socialClass('github')}
                        >
                          {SocialIcon.github}
                        </a>
                      )}
                      {socials.linkedin && (
                        <a
                          href={socials.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`LinkedIn của ${name}`}
                          className={socialClass('linkedin')}
                        >
                          {SocialIcon.linkedin}
                        </a>
                      )}
                      {socials.facebook && (
                        <a
                          href={socials.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Facebook của ${name}`}
                          className={socialClass('facebook')}
                        >
                          {SocialIcon.facebook}
                        </a>
                      )}
                    </div>
                  )}
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
            &copy; {new Date().getFullYear()} TicketRush. Đã đăng ký bản quyền.
          </p>
          <div className={`flex items-center gap-1 ${muted}`}>
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Hệ thống đang hoạt động ổn định
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer