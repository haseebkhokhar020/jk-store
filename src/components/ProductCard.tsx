import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShoppingBag, Star } from 'lucide-react'
import type { Product } from '../lib/types'
import { formatMoney, priceOf } from '../lib/format'
import { useBranding } from '../lib/branding'
import { useCart } from '../lib/cart'

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { store } = useBranding()
  const { add } = useCart()
  const sym = store?.currency_symbol || 'Rs.'
  const p = priceOf(product)
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.08 }}
      className="card-hover group flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-neutral-100"
    >
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream">
        <img src={product.images[0]} alt={product.name} loading="lazy"
             className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        {p.onSale && p.discountPercent != null && (
          <span className="sale-shimmer absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-bold text-white shadow">
            -{p.discountPercent}% OFF
          </span>
        )}
        {product.stock <= 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold text-white">Out of stock</span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-xs text-neutral-500">
          <Star size={13} className="fill-champagne-500 text-champagne-500" />
          {Number(product.rating).toFixed(1)} ({product.reviews_count.toLocaleString()}+ reviews)
        </div>
        <Link to={`/product/${product.slug}`} className="mt-1.5 font-display text-lg font-semibold leading-snug hover:underline">
          {product.name}
        </Link>
        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">{product.short_description}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold" style={{ color: 'var(--brand-primary)' }}>{formatMoney(p.unit, sym)}</span>
          {p.onSale && <span className="text-sm text-neutral-400 line-through">{formatMoney(p.original, sym)}</span>}
        </div>
        <button
          disabled={product.stock <= 0}
          onClick={() => add(product, 1)}
          className="mt-3 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-neutral-300"
          style={{ backgroundColor: 'var(--brand-secondary)' }}
        >
          <ShoppingBag size={15} /> {product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </motion.div>
  )
}
