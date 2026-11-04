import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Package, User } from 'lucide-react'
import { useAuth } from '../lib/auth'
import { useBranding } from '../lib/branding'
import { supabase } from '../lib/supabase'
import { formatMoney } from '../lib/format'
import type { Order } from '../lib/types'

export default function Account() {
  const { session, profile, signOut, loading } = useAuth()
  const { store, branding } = useBranding()
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const sym = store?.currency_symbol || 'Rs.'

  useEffect(() => {
    if (!loading && !session) navigate('/login', { replace: true })
  }, [loading, session, navigate])

  useEffect(() => {
    if (session?.user) {
      supabase.from('orders').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false })
        .then(r => setOrders(r.data || []))
    }
  }, [session])

  if (loading || !session) return <div className="py-24 text-center text-neutral-400">Loading…</div>

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full brand-bg">
            <User className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">{profile?.full_name || session.user.user_metadata?.full_name || 'My Account'}</h1>
            <p className="text-sm text-neutral-500">{session.user.email} · {profile?.phone || session.user.user_metadata?.phone || ''}</p>
          </div>
        </div>
        <button onClick={async () => { await signOut(); navigate('/') }}
          className="flex items-center gap-2 rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-semibold hover:bg-neutral-50">
          <LogOut size={15} /> Sign out
        </button>
      </motion.div>

      <h2 className="font-display mt-10 text-2xl font-bold">My Orders</h2>
      <p className="mt-1 text-sm text-neutral-500">All orders placed with this account at {branding?.store_name}.</p>
      {orders.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-10 text-center shadow-card ring-1 ring-neutral-100">
          <Package size={36} className="mx-auto text-neutral-300" />
          <p className="mt-3 text-sm text-neutral-500">No orders yet. <Link to="/shop" className="font-bold brand-text hover:underline">Start shopping</Link></p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((o, i) => (
            <motion.div key={o.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-neutral-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold">{o.order_number}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{new Date(o.created_at).toLocaleString()} · {o.payment_method}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${o.status === 'Delivered' ? 'bg-green-100 text-green-700' : o.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-champagne-100 text-champagne-800'}`}>{o.status}</span>
                  <span className="font-bold brand-text">{formatMoney(o.total, sym)}</span>
                  <Link to={`/track?order=${o.order_number}&phone=${encodeURIComponent(o.phone)}`}
                    className="rounded-full px-4 py-2 text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    Track
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
