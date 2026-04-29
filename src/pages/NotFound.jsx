import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 text-slate-900 md:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
        <p className="text-sm uppercase tracking-[0.2em] text-sky-600">404</p>
        <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-slate-600">The page you requested does not exist.</p>
        <Link to="/" className="mt-8 inline-flex rounded-full bg-sky-500 px-5 py-3 font-semibold text-white">
          Back to home
        </Link>
      </div>
    </div>
  )
}

export default NotFound
