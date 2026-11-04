import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, UserPlus } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useBranding } from '../lib/branding'

export default function Register() {
  const { signUp } = useAuth()
  const { branding } = useBranding()
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '' })
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const err = await signUp(form.email, form.password, form.full_name, form.phone, remember)
    setLoading(false)
    if (err) setError(err)
    else navigate('/account')
  }

  const input = "w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100"

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-white p-8 shadow-soft ring-1 ring-neutral-100">
        <UserPlus className="brand-text" size={28} />
        <h1 className="font-display mt-3 text-3xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-neutral-500">One account at {branding?.store_name} — your details and orders, remembered. (Checkout also works as guest.)</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Full Name</label>
            <input className={input} required value={form.full_name} onChange={e => set('full_name', e.target.value)} /></div>
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Mobile Number</label>
            <input className={input} required placeholder="03XX-XXXXXXX" value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Email</label>
            <input className={input} type="email" required value={form.email} onChange={e => set('email', e.target.value)} /></div>
          <div><label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Password</label>
            <input className={input} type="password" required minLength={6} value={form.password} onChange={e => set('password', e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} className="h-4 w-4 accent-yellow-600" />
            Remember me on this device
          </label>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--brand-secondary)' }}>
            {loading && <Loader2 size={16} className="animate-spin" />} Create Account
          </button>
        </form>
        <p className="mt-5 text-center text-sm text-neutral-500">
          Already have an account? <Link to="/login" className="font-bold brand-text hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
