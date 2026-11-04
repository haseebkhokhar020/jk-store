import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { useBranding } from '../lib/branding'
import { useCart } from '../lib/cart'
import { formatMoney, priceOf } from '../lib/format'
import OrderButtons from '../components/OrderButtons'

export default function CartPage() {
  const { items, setQty, remove, subtotal, discount } = useCart()
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const delivery = store?.free_delivery_threshold != null && subtotal >= Number(store.free_delivery_threshold)
    ? 0 : Number(store?.delivery_charge ?? 200)

  if (!items.length) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-neutral-300" />
        <h1 className="font-display mt-4 text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-neutral-500">Discover our premium collection and add something beautiful.</p>
        <Link to="/shop" className="mt-8 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand-secondary)' }}>
          Continue Shopping <ArrowRight size={15} />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl font-bold">Your Cart</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.map((i, idx) => {
            const p = priceOf(i.product)
            return (
              <motion.div key={i.product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="flex gap-4 rounded-2xl bg-white p-4 shadow-card ring-1 ring-neutral-100">
                <Link to={`/product/${i.product.slug}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-cream">
                  <img src={i.product.images[0]} alt={i.product.name} className="h-full w-full object-cover" />
                </Link>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <Link to={`/product/${i.product.slug}`} className="font-semibold leading-snug hover:underline">{i.product.name}</Link>
                    <button onClick={() => remove(i.product.id)} className="text-neutral-400 transition hover:text-red-500" aria-label="Remove"><Trash2 size={17} /></button>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2 text-sm">
                    <span className="font-bold brand-text">{formatMoney(p.unit, sym)}</span>
                    {p.onSale && <span className="text-xs text-neutral-400 line-through">{formatMoney(p.original, sym)}</span>}
                    {p.onSale && p.discountPercent != null && <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">-{p.discountPercent}%</span>}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <div className="flex items-center rounded-full border border-neutral-200">
                      <button onClick={() => setQty(i.product.id, i.quantity - 1)} className="p-2 hover:bg-neutral-50"><Minus size={13} /></button>
                      <span className="w-7 text-center text-sm font-bold">{i.quantity}</span>
                      <button onClick={() => setQty(i.product.id, i.quantity + 1)} className="p-2 hover:bg-neutral-50"><Plus size={13} /></button>
                    </div>
                    <span className="font-bold">{formatMoney(p.unit * i.quantity, sym)}</span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100 lg:sticky lg:top-24">
          <h2 className="font-display text-xl font-bold">Order Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-neutral-500">Subtotal</dt><dd className="font-semibold">{formatMoney(subtotal, sym)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-green-600"><dt>Discount</dt><dd className="font-semibold">-{formatMoney(discount, sym)}</dd></div>}
            <div className="flex justify-between"><dt className="text-neutral-500">Delivery</dt><dd className="font-semibold">{delivery === 0 ? 'FREE' : formatMoney(delivery, sym)}</dd></div>
            <div className="flex justify-between border-t border-neutral-100 pt-3 text-base"><dt className="font-bold">Total</dt><dd className="font-bold brand-text">{formatMoney(subtotal + delivery, sym)}</dd></div>
          </dl>
          {store?.free_delivery_threshold != null && subtotal < Number(store.free_delivery_threshold) && (
            <p className="mt-3 rounded-lg bg-champagne-50 p-2.5 text-xs text-champagne-800">
              Add {formatMoney(Number(store.free_delivery_threshold) - subtotal, sym)} more for FREE delivery!
            </p>
          )}
          <Link to="/checkout" className="mt-5 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90"
            style={{ backgroundColor: 'var(--brand-secondary)' }}>
            Proceed to Checkout <ArrowRight size={15} />
          </Link>
          <div className="mt-5 border-t border-neutral-100 pt-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Or order directly</p>
            <OrderButtons where="cart" label={`Hello! I'd like to place an order. Cart total: ${sym}${subtotal.toFixed(2)}. Please share your catalogue and confirm.`} />
          </div>
        </div>
      </div>
    </div>
  )
}
