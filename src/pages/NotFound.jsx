import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-white md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-slate-400">The page you requested does not exist.</p>
        <Link to="/" className="mt-8 inline-flex rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950">
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
