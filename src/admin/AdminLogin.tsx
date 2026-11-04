import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Loader2, Lock } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'

export default function AdminLogin() {
  const { branding } = useBranding()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) throw authErr
      // Verify the signed-in user is an active admin
      const { data: admin } = await supabase.from('admin_users').select('id, is_active').eq('id', data.user.id).maybeSingle()
      if (!admin || !admin.is_active) {
        await supabase.auth.signOut()
        throw new Error('This account is not an active administrator.')
      }
      navigate('/admin')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white p-8 shadow-soft">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full brand-bg">
            <Lock size={22} className="text-white" />
          </div>
          <h1 className="font-display mt-4 text-2xl font-bold">{branding?.store_name || 'JK Store'} Admin</h1>
          <p className="mt-1 text-xs text-neutral-500">Sign in to manage your store</p>
        </div>
        <form onSubmit={login} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Password</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100" />
          </div>
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
          <button disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--brand-secondary)' }}>
            {loading && <Loader2 size={16} className="animate-spin" />} Sign In
          </button>
        </form>
      </motion.div>
    </div>
  )
}
