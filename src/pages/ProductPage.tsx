import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, ChevronRight, Minus, Plus, ShoppingBag, Star, Truck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import { useCart } from '../lib/cart'
import type { Product } from '../lib/types'
import { formatMoney, priceOf } from '../lib/format'
import OrderButtons from '../components/OrderButtons'

export default function ProductPage() {
  const { slug } = useParams()
  const { store, branding } = useBranding()
  const { add } = useCart()
  const [product, setProduct] = useState<Product | null>(null)
  const [related, setRelated] = useState<Product[]>([])
  const [img, setImg] = useState(0)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    setProduct(null); setImg(0)
    supabase.from('products').select('*').eq('slug', slug || '').eq('is_published', true).maybeSingle()
      .then(r => {
        setProduct(r.data)
        if (r.data?.category_id) {
          supabase.from('products').select('*').eq('is_published', true).eq('category_id', r.data.category_id)
            .neq('id', r.data.id).limit(3).then(rr => setRelated(rr.data || []))
        }
      })
  }, [slug])

  if (!product) {
    return <div className="mx-auto max-w-7xl px-6 py-24 text-center text-neutral-500">Loading product…</div>
  }

  const sym = store?.currency_symbol || 'Rs.'
  const p = priceOf(product)

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex items-center gap-1.5 text-xs text-neutral-500">
        <Link to="/" className="hover:underline">Home</Link><ChevronRight size={12} />
        <Link to="/shop" className="hover:underline">Shop</Link><ChevronRight size={12} />
        <span className="text-neutral-800">{product.name}</span>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="relative overflow-hidden rounded-3xl bg-cream ring-1 ring-neutral-100">
            <img key={product.images[img]} src={product.images[img]} alt={product.name}
              className="aspect-square w-full object-cover" />
            {p.onSale && p.discountPercent != null && (
              <span className="sale-shimmer absolute left-4 top-4 rounded-full px-3 py-1.5 text-sm font-bold text-white shadow">-{p.discountPercent}% OFF</span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="no-scrollbar flex gap-3 overflow-x-auto">
              {product.images.map((im, i) => (
                <button key={i} onClick={() => setImg(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 transition ${i === img ? 'ring-champagne-500' : 'ring-transparent opacity-60 hover:opacity-100'}`}>
                  <img src={im} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center gap-1 text-sm text-neutral-500">
            <Star size={15} className="fill-champagne-500 text-champagne-500" />
            {Number(product.rating).toFixed(1)} · {product.reviews_count.toLocaleString()}+ reviews
          </div>
          <h1 className="font-display mt-2 text-3xl font-bold sm:text-4xl">{product.name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>{formatMoney(p.unit, sym)}</span>
            {p.onSale && <span className="text-lg text-neutral-400 line-through">{formatMoney(p.original, sym)}</span>}
            {p.onSale && p.discountPercent != null && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600">SALE -{p.discountPercent}%</span>
            )}
          </div>

          <p className="mt-5 leading-relaxed text-neutral-600">{product.description}</p>

          {Object.keys(product.specifications || {}).length > 0 && (
            <div className="mt-6 rounded-2xl bg-cream p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider brand-text">Specifications</h3>
              <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(product.specifications).map(([k, v]) => (
                  <div key={k} className="flex gap-2 text-sm">
                    <span className="font-semibold text-neutral-800">{k}:</span>
                    <span className="text-neutral-600">{v}</span>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Quantity + add to cart */}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <div className="flex items-center rounded-full border border-neutral-200">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="p-3 hover:bg-neutral-50" aria-label="Decrease"><Minus size={15} /></button>
              <span className="w-8 text-center text-sm font-bold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(99, q + 1))} className="p-3 hover:bg-neutral-50" aria-label="Increase"><Plus size={15} /></button>
            </div>
            <button disabled={product.stock <= 0}
              onClick={() => { add(product, qty); setAdded(true); setTimeout(() => setAdded(false), 1600) }}
              className="flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-bold text-white transition hover:opacity-90 disabled:bg-neutral-300 sm:flex-none sm:px-10"
              style={{ backgroundColor: 'var(--brand-secondary)' }}>
              {added ? <><Check size={16} /> Added!</> : <><ShoppingBag size={16} /> Add to Cart</>}
            </button>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
            <Truck size={14} className="brand-text" />
            {store?.free_delivery_threshold
              ? `Delivery ${sym}${Number(store.delivery_charge).toFixed(0)} — FREE on orders above ${sym}${Number(store.free_delivery_threshold).toFixed(0)}`
              : `Delivery charge ${sym}${Number(store?.delivery_charge ?? 200).toFixed(0)}`} · Cash on Delivery · {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </p>

          {/* Call / WhatsApp ordering */}
          <div className="mt-6 border-t border-neutral-100 pt-6">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">Prefer to order by phone or WhatsApp?</p>
            <OrderButtons where="product" product={product} qty={qty} />
          </div>
        </motion.div>
      </div>

      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="font-display mb-6 text-2xl font-bold">You may also like</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {related.map(r => (
              <Link key={r.id} to={`/product/${r.slug}`} className="card-hover group overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-neutral-100">
                <div className="aspect-square overflow-hidden"><img src={r.images[0]} alt={r.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
                <div className="p-4">
                  <p className="font-semibold">{r.name}</p>
                  <p className="mt-1 font-bold brand-text">{formatMoney(priceOf(r).unit, sym)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <p className="mt-10 text-xs text-neutral-400">Brand: {branding?.store_name}</p>
    </div>
  )
}
