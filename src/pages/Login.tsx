import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, LogIn } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useBranding } from '../lib/branding'

export default function Login() {
  const { signIn } = useAuth()
  const { branding } = useBranding()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const err = await signIn(email, password, remember)
    setLoading(false)
    if (err) setError(err)
    else navigate('/account')
  }

  const input = "w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100"

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-neutral-100">
        <LogIn className="brand-text" size={28} />
        <h1 className="font-display mt-3 text-3xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-neutral-500">Sign in to {branding?.store_name} to see your orders</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Email</label>
            <input className={input} type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Password</label>
            <input className={input} type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 accent-yellow-600" />
            Remember me on this device
          </label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--brand-secondary)' }}>
            {loading && <Loader2 size={16} className="animate-spin" />} Sign In
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500">
          New here? <Link to="/register" className="font-bold brand-text hover:underline">Create an account</Link> · or <Link to="/track" className="font-semibold hover:underline">track with order ID</Link>
        </p>
      </motion.div>
    </div>
  )
}
