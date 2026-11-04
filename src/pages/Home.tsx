import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Truck } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import type { Product } from '../lib/types'
import ProductCard from '../components/ProductCard'

export default function Home() {
  const { branding, store } = useBranding()
  const [featured, setFeatured] = useState<Product[]>([])
  const [all, setAll] = useState<Product[]>([])

  useEffect(() => {
    supabase.from('products').select('*').eq('is_published', true).eq('is_featured', true).order('created_at').then(r => setFeatured(r.data || []))
    supabase.from('products').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(8).then(r => setAll(r.data || []))
  }, [])

  const perks = [
    { icon: Truck, title: 'Cash on Delivery', text: 'Pay when your order arrives — all over Pakistan' },
    { icon: Leaf, title: '100% Herbal', text: 'Natural ingredients, gentle on hair & skin' },
    { icon: ShieldCheck, title: 'Trusted Store', text: `${branding?.store_name || 'JK Store'} — quality you can rely on` },
    { icon: Sparkles, title: 'Premium Quality', text: 'Carefully sourced cosmetics & beauty products' },
  ]

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-cream">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ background: 'var(--brand-primary)' }} />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-champagne-100 opacity-60 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 sm:py-24 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-block rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-widest brand-text brand-border">
              {branding?.business_category || 'Cosmetics & Beauty'}
            </span>
            <h1 className="font-display mt-5 text-4xl font-bold leading-tight sm:text-6xl" style={{ color: 'var(--brand-secondary)' }}>
              Beauty that begins with <span className="brand-text italic">natural care</span>
            </h1>
            <p className="mt-5 max-w-lg text-neutral-600">
              {branding?.tagline || `Welcome to ${branding?.store_name}. Explore premium herbal hair care and beauty products with Cash on Delivery across Pakistan.`}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop"
                className="group flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ backgroundColor: 'var(--brand-secondary)' }}>
                Shop Now <ArrowRight size={16} className="transition group-hover:translate-x-1" />
              </Link>
              <Link to="/track" className="rounded-full border-2 px-7 py-3 text-sm font-semibold transition hover:bg-neutral-50"
                style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-secondary)' }}>
                Track My Order
              </Link>
            </div>
            <p className="mt-6 text-xs text-neutral-500">Proprietor: {branding?.owner_name} • Delivery charge {store ? `${store.currency_symbol}${Number(store.delivery_charge).toFixed(0)}` : 'Rs.200'}{store?.free_delivery_threshold ? ` — free above ${store.currency_symbol}${Number(store.free_delivery_threshold).toFixed(0)}` : ''}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.15 }}
            className="relative mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[2rem] shadow-soft ring-1 ring-black/5">
              <img src="/products/combo-banner.jpg" alt="Featured products" className="h-full w-full object-cover" />
            </div>
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="absolute -bottom-5 -left-5 rounded-2xl bg-white px-5 py-4 shadow-soft">
              <p className="font-display text-2xl font-bold brand-text">4.9 ★</p>
              <p className="text-xs text-neutral-500">5,500+ happy customers</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {perks.map((p, i) => (
            <motion.div key={p.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white p-6 text-center shadow-card ring-1 ring-neutral-100">
              <p.icon className="mx-auto brand-text" size={26} />
              <h3 className="mt-3 font-semibold">{p.title}</h3>
              <p className="mt-1 text-xs text-neutral-500">{p.text}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">Featured Products</h2>
            <p className="mt-2 text-sm text-neutral-500">Handpicked bestsellers from our collection</p>
          </div>
          <Link to="/shop" className="group hidden items-center gap-1 text-sm font-semibold brand-text sm:flex">
            View all <ArrowRight size={15} className="transition group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* Promo banner */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2rem] px-8 py-14 text-center text-white sm:px-16"
          style={{ background: `linear-gradient(120deg, var(--brand-secondary), #3a3120 60%, var(--brand-primary))` }}>
          <h2 className="font-display text-3xl font-bold sm:text-5xl">Sale — up to 20% OFF</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/80">
            Grab the Dr. Zain Oil & Shampoo combo at Rs. 1,600 instead of Rs. 2,000. Limited stock — order today with Cash on Delivery.
          </p>
          <Link to="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold transition hover:scale-105"
            style={{ color: 'var(--brand-secondary)' }}>
            Shop the Sale <ArrowRight size={15} />
          </Link>
        </motion.div>
      </section>

      {/* All products */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <h2 className="font-display mb-8 text-3xl font-bold sm:text-4xl">New Arrivals</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {all.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>
    </div>
  )
}
