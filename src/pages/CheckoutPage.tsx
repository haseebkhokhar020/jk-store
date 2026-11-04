import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { useBranding } from '../lib/branding'
import { useCart } from '../lib/cart'
import { formatMoney } from '../lib/format'
import OrderButtons from '../components/OrderButtons'

const PK_CITIES = ['Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala', 'Hyderabad', 'Sukkur', 'Other']

export default function CheckoutPage() {
  const { items, subtotal, discount, clear } = useCart()
  const { store, branding } = useBranding()
  const navigate = useNavigate()
  const sym = store?.currency_symbol || 'Rs.'
  const delivery = store?.free_delivery_threshold != null && subtotal >= Number(store.free_delivery_threshold)
    ? 0 : Number(store?.delivery_charge ?? 200)
  const total = subtotal + delivery

  const [form, setForm] = useState({ full_name: '', phone: '', email: '', city: '', address: '', instructions: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [placing, setPlacing] = useState(false)
  const [done, setDone] = useState<string | null>(null)

  const clientOrderId = useMemo(() => crypto.randomUUID(), [])

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (!form.full_name.trim()) errs.full_name = 'Full name is required'
    if (!/^\+?[\d\s-]{8,15}$/.test(form.phone.trim())) errs.phone = 'Enter a valid mobile number'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = 'Enter a valid email'
    if (!form.city) errs.city = 'Select your city'
    if (!form.address.trim() || form.address.trim().length < 8) errs.address = 'Enter a complete address'
    setErrors(errs)
    if (Object.keys(errs).length || !items.length) return

    setPlacing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_order_id: clientOrderId, source: 'website',
          ...form, items: items.map(i => ({ product_id: i.product.id, quantity: i.quantity })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      clear()
      setDone(data.order_number)
    } catch (err: any) {
      setErrors({ form: err?.message || 'Something went wrong. Please try again or order via WhatsApp.' })
    } finally {
      setPlacing(false)
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle2 size={64} className="mx-auto text-green-500" />
        </motion.div>
        <h1 className="font-display mt-6 text-3xl font-bold">Order Placed Successfully!</h1>
        <p className="mt-3 text-sm text-neutral-600">
          Your order ID is <span className="font-mono font-bold brand-text">{done}</span>.
          {form.email && ' A confirmation email has been sent to you.'} Keep it to track your order.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button onClick={() => navigate(`/track`)} className="rounded-full px-7 py-3 text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--brand-secondary)' }}>Track Order</button>
          <Link to="/shop" className="rounded-full border px-7 py-3 text-sm font-semibold">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Nothing to checkout</h1>
        <Link to="/shop" className="mt-6 inline-block rounded-full px-7 py-3 text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>Go to Shop</Link>
      </div>
    )
  }

  const input = "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100"
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500"

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Checkout</h1>
      <p className="mt-2 text-sm text-neutral-500">Guest checkout — no account needed. Payment: Cash on Delivery.</p>

      <form onSubmit={submit} className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
            <h2 className="font-display text-lg font-bold">Delivery Details</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className={label}>Full Name *</label>
                <input className={input} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="e.g. Ahmed Khan" />
                {errors.full_name && <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>}
              </div>
              <div>
                <label className={label}>Mobile Number *</label>
                <input className={input} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="03XX-XXXXXXX" />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div>
                <label className={label}>Email (optional)</label>
                <input className={input} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </div>
              <div>
                <label className={label}>City *</label>
                <select className={input} value={form.city} onChange={e => set('city', e.target.value)}>
                  <option value="">Select city</option>
                  {PK_CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Complete Address *</label>
                <textarea className={input} rows={3} value={form.address} onChange={e => set('address', e.target.value)} placeholder="House #, Street, Area, City" />
                {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Order Instructions (optional)</label>
                <input className={input} value={form.instructions} onChange={e => set('instructions', e.target.value)} placeholder="Any notes for delivery" />
              </div>
            </div>
            {errors.form && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errors.form}</p>}
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
            <h2 className="font-display text-lg font-bold">Prefer phone or WhatsApp?</h2>
            <p className="mt-1 text-xs text-neutral-500">Send us your order on WhatsApp or call us — we'll confirm manually.</p>
            <div className="mt-4"><OrderButtons where="checkout" label={`Hello! I want to order:\n${items.map(i => `• ${i.product.name} x${i.quantity}`).join('\n')}\nTotal: ${sym}${(subtotal + delivery).toFixed(2)} (COD). Please confirm.`} /></div>
          </div>
        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100 lg:sticky lg:top-24">
          <h2 className="font-display text-lg font-bold">Your Order</h2>
          <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-1">
            {items.map(i => (
              <li key={i.product.id} className="flex items-center gap-3">
                <img src={i.product.images[0]} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="flex-1 text-sm">
                  <p className="font-medium leading-tight">{i.product.name} <span className="text-neutral-400">×{i.quantity}</span></p>
                </div>
                <span className="text-sm font-semibold">{formatMoney(i.quantity * (i.product.selling_price ?? i.product.original_price) - 0, sym)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd>{formatMoney(subtotal, sym)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><dt>Discount</dt><dd>-{formatMoney(discount, sym)}</dd></div>}
            <div className="flex justify-between"><dt className="text-neutral-500">Delivery</dt><dd>{delivery === 0 ? 'FREE' : formatMoney(delivery, sym)}</dd></div>
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-bold"><dt>Total</dt><dd className="brand-text">{formatMoney(total, sym)}</dd></div>
          </dl>
          <button type="submit" disabled={placing}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full py-4 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: 'var(--brand-secondary)' }}>
            {placing ? <><Loader2 size={16} className="animate-spin" /> Placing order…</> : `Place Order — ${formatMoney(total, sym)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-neutral-400">
            <ShieldCheck size={13} className="brand-text" /> {branding?.store_name} · Cash on Delivery · Secure checkout
          </p>
        </div>
      </form>
    </div>
  )
}
