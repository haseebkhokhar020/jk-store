import { useState } from 'react'
import { motion } from 'framer-motion'
import { Loader2, PackageSearch, Truck } from 'lucide-react'
import { formatMoney } from '../lib/format'
import { useBranding } from '../lib/branding'

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered']

export default function TrackOrder() {
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)

  const search = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await fetch(`/api/track?order=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phone.trim())}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Not found')
      setResult(data.order)
    } catch (err: any) {
      setError(err?.message || 'Order not found')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = result ? STATUS_STEPS.indexOf(result.status) : -1

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <PackageSearch size={44} className="mx-auto brand-text" />
        <h1 className="font-display mt-4 text-4xl font-bold">Track Your Order</h1>
        <p className="mt-2 text-sm text-neutral-500">Enter your order ID and the phone number used at checkout.</p>
      </motion.div>

      <form onSubmit={search} className="mt-8 rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Order ID</label>
        <input value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. JK-20261104-AB12CD"
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100" />
        <label className="mb-1.5 mt-4 block text-xs font-bold uppercase tracking-wider text-neutral-500">Phone Number</label>
        <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="03XX-XXXXXXX"
          className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100" />
        <button type="submit" disabled={loading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: 'var(--brand-secondary)' }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />} {loading ? 'Searching…' : 'Track Order'}
        </button>
        {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-center text-sm text-red-600">{error}</p>}
      </form>

      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Order {result.order_number}</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${result.status === 'Delivered' ? 'bg-green-100 text-green-700' : result.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-champagne-100 text-champagne-800'}`}>
              {result.status}
            </span>
          </div>

          {/* Progress */}
          {result.status !== 'Cancelled' && (
            <div className="mt-6">
              <div className="flex items-center">
                {STATUS_STEPS.map((s, i) => (
                  <div key={s} className="flex flex-1 items-center last:flex-none">
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${i <= stepIndex ? 'text-white' : 'bg-neutral-200 text-neutral-500'}`}
                      style={i <= stepIndex ? { backgroundColor: 'var(--brand-primary)' } : {}}>
                      {i + 1}
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`h-1 flex-1 rounded ${i < stepIndex ? '' : 'bg-neutral-200'}`} style={i < stepIndex ? { backgroundColor: 'var(--brand-primary)' } : {}} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[10px] font-medium text-neutral-500">
                <span>Placed</span><span className="hidden sm:inline">Confirmed</span><span className="hidden sm:inline">Processing</span><span className="hidden sm:inline">Shipped</span><span className="hidden sm:inline">Out</span><span>Delivered</span>
              </div>
            </div>
          )}

          <ul className="mt-6 space-y-2 border-t border-neutral-100 pt-4">
            {result.items.map((it: any, i: number) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{it.product_name} × {it.quantity}</span>
                <span className="font-semibold">{formatMoney(it.line_total, sym)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between text-neutral-500"><dt>Subtotal</dt><dd>{formatMoney(result.subtotal, sym)}</dd></div>
            {Number(result.discount_total) > 0 && <div className="flex justify-between text-green-600"><dt>Discount</dt><dd>-{formatMoney(result.discount_total, sym)}</dd></div>}
            <div className="flex justify-between text-neutral-500"><dt>Delivery</dt><dd>{formatMoney(result.delivery_charge, sym)}</dd></div>
            <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd className="brand-text">{formatMoney(result.total, sym)}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-neutral-400">Placed on {new Date(result.created_at).toLocaleString()} · Payment: {result.payment_method} · Deliver to: {result.city}</p>
        </motion.div>
      )}
    </div>
  )
}
