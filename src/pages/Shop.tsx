import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Category, Product } from '../lib/types'
import { priceOf } from '../lib/format'
import ProductCard from '../components/ProductCard'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'name' | 'rating'

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const q = params.get('q') || ''
  const cat = params.get('category') || ''
  const sort = (params.get('sort') || 'featured') as SortKey
  const saleOnly = params.get('sale') === '1'

  useEffect(() => {
    supabase.from('categories').select('*').eq('is_active', true).order('sort_order').then(r => setCategories(r.data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let query = supabase.from('products').select('*').eq('is_published', true)
    if (cat) query = query.eq('category_id', categories.find(c => c.slug === cat)?.id || '')
    if (q) query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%,tags.cs.{${q}}`)
    query.then(r => { setProducts(r.data || []); setLoading(false) })
  }, [q, cat, categories])

  const visible = useMemo(() => {
    let list = [...products]
    if (saleOnly) list = list.filter(p => priceOf(p).onSale)
    switch (sort) {
      case 'price-asc': list.sort((a, b) => priceOf(a).unit - priceOf(b).unit); break
      case 'price-desc': list.sort((a, b) => priceOf(b).unit - priceOf(a).unit); break
      case 'name': list.sort((a, b) => a.name.localeCompare(b.name)); break
      case 'rating': list.sort((a, b) => b.rating - a.rating); break
      default: list.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0))
    }
    return list
  }, [products, sort, saleOnly])

  const set = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v); else next.delete(k)
    setParams(next, { replace: true })
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.h1 initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="font-display text-4xl font-bold sm:text-5xl">Shop</motion.h1>
      <p className="mt-2 text-sm text-neutral-500">Premium cosmetics & beauty — cash on delivery across Pakistan</p>

      {/* Toolbar */}
      <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input value={q} onChange={e => set('q', e.target.value)} placeholder="Search products…"
            className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-11 pr-4 text-sm outline-none transition focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => set('category', '')}
            className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition ${!cat ? 'text-white' : 'ring-neutral-200 hover:bg-neutral-50'}`}
            style={!cat ? { backgroundColor: 'var(--brand-secondary)' } : {}}>
            All
          </button>
          {categories.map(c => (
            <button key={c.id} onClick={() => set('category', cat === c.slug ? '' : c.slug)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ring-1 transition ${cat === c.slug ? 'text-white' : 'ring-neutral-200 hover:bg-neutral-50'}`}
              style={cat === c.slug ? { backgroundColor: 'var(--brand-secondary)' } : {}}>
              {c.name}
            </button>
          ))}
          <button onClick={() => set('sale', saleOnly ? '' : '1')}
            className={`rounded-full px-4 py-2 text-xs font-bold ring-1 transition ${saleOnly ? 'sale-shimmer text-white' : 'ring-neutral-200 hover:bg-neutral-50'}`}>
            On Sale
          </button>
          <div className="relative">
            <SlidersHorizontal size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <select value={sort} onChange={e => set('sort', e.target.value)}
              className="appearance-none rounded-full border border-neutral-200 bg-white py-2.5 pl-9 pr-8 text-xs font-semibold outline-none">
              <option value="featured">Featured</option>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
              <option value="name">Name A–Z</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-neutral-100" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-20 text-center text-neutral-500">No products found. Try a different search.</div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  )
}
