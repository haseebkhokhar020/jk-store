import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-28 text-center">
      <p className="font-display text-7xl font-bold brand-text">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <Link to="/" className="mt-8 inline-block rounded-full px-8 py-3 text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>
        Back to Home
      </Link>
    </div>
  )
}
