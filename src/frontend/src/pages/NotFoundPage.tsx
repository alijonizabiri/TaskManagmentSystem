import { Link } from 'react-router-dom'

export const NotFoundPage = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-muted/50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-card">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-indigo-500">404</p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">Page not found</h1>
        <p className="mt-2 text-sm text-gray-500">The page you requested does not exist or moved to another route.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
