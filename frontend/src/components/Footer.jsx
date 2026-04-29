function Footer() {
  return (
    <footer className="mt-auto w-full bg-gray-800 py-4 text-gray-300">
      <div className="mx-auto max-w-7xl text-center text-sm">
        &copy; {new Date().getFullYear()} TicketRush. All rights reserved.
      </div>
      <div className="mx-auto max-w-7xl px-4 py-3 text-center text-sm leading-relaxed text-gray-400">
        <p className="mb-3">
          TicketRush is an electronic ticket distribution platform built and operated by an event organizing unit. The system allows this unit to upload music and entertainment events, set up visual seating arrangements, and open online ticket sales to audiences.
        </p>
        <p className="text-xs text-gray-500">
          Built by:<br />
          Nguyen Phuoc Nguong Long<br />
          Dinh Minh Vu<br />
          Nguyen Van Lap
        </p>
      </div>
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-4 py-2 text-gray-400">
        <a href="#" className="transition hover:text-gray-200">Privacy Policy</a>
        <span>|</span>
        <a href="#" className="transition hover:text-gray-200">Terms of Service</a>
        <span>|</span>
        <a href="#" className="transition hover:text-gray-200">Contact Us</a>
      </div>
    </footer>
  )
}

export default Footer
