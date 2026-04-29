import { useTheme } from '../context/ThemeContext.jsx'

function Footer() {
  const { isDark } = useTheme()

  return (
    <footer className={`mt-auto w-full border-t py-4 ${isDark ? 'border-slate-800 bg-slate-900 text-slate-400' : 'border-slate-200 bg-white text-slate-600'}`}>
      <div className="mx-auto max-w-7xl text-center text-sm">
        &copy; {new Date().getFullYear()} TicketRush. All rights reserved.
      </div>
      <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm leading-relaxed">
        <p className={`mb-3 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          TicketRush is an electronic ticket distribution platform built and operated by an event organizing unit. The system allows this unit to upload music and entertainment events, set up visual seating arrangements, and open online ticket sales to audiences.
        </p>
        <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Built by:<br />
          Nguyen Phuoc Nguong Long<br />
          Dinh Minh Vu<br />
          Nguyen Van Lap
        </p>
      </div>
      <div className={`mx-auto flex max-w-7xl items-center justify-center gap-4 py-2 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        <a href="#" className={`transition ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-900'}`}>Privacy Policy</a>
        <span>|</span>
        <a href="#" className={`transition ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-900'}`}>Terms of Service</a>
        <span>|</span>
        <a href="#" className={`transition ${isDark ? 'hover:text-slate-300' : 'hover:text-slate-900'}`}>Contact Us</a>
      </div>
    </footer>
  )
}

export default Footer
