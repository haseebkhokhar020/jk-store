import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Banknote, Clock, Package, ShoppingCart, TrendingUp, Truck, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import { formatMoney } from '../lib/format'
import type { Order, OrderStatus } from '../lib/types'

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

export default function Dashboard() {
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const [orders, setOrders] = useState<Order[]>([])
  const [productsCount, setProductsCount] = useState(0)
  const [customersCount, setCustomersCount] = useState(0)

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false }).then(r => setOrders(r.data || []))
    supabase.from('products').select('id', { count: 'exact', head: true }).then(r => setProductsCount(r.count || 0))
    supabase.from('customers').select('id', { count: 'exact', head: true }).then(r => setCustomersCount(r.count || 0))
  }, [])

  const revenue = orders.filter(o => o.status !== 'Cancelled').reduce((s, o) => s + Number(o.total), 0)
  const pending = orders.filter(o => o.status === 'Pending').length
  const delivered = orders.filter(o => o.status === 'Delivered').length
  const shipped = orders.filter(o => ['Shipped', 'Out for Delivery'].includes(o.status)).length
  const counts = Object.fromEntries(STATUSES.map(s => [s, orders.filter(o => o.status === s).length]))

  // Simple 14-day revenue bars
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i))
    return d.toISOString().slice(0, 10)
  })
  const perDay = days.map(d => orders.filter(o => o.created_at.slice(0, 10) === d && o.status !== 'Cancelled').reduce((s, o) => s + Number(o.total), 0))
  const max = Math.max(...perDay, 1)

  const stats = [
    { label: 'Total Revenue', value: formatMoney(revenue, sym), icon: Banknote, color: 'text-green-600' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'brand-text' },
    { label: 'Pending', value: pending, icon: Clock, color: 'text-amber-600' },
    { label: 'Shipped / Out', value: shipped, icon: Truck, color: 'text-blue-600' },
    { label: 'Delivered', value: delivered, icon: TrendingUp, color: 'text-green-600' },
    { label: 'Products', value: productsCount, icon: Package, color: 'brand-text' },
    { label: 'Customers', value: customersCount, icon: Users, color: 'text-purple-600' },
  ]

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Dashboard</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-neutral-100">
            <s.icon size={22} className={s.color} />
            <p className="mt-3 text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-5">
        {/* Revenue chart */}
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100 lg:col-span-3">
          <h2 className="font-display text-lg font-bold">Revenue — last 14 days</h2>
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {perDay.map((v, i) => (
              <div key={i} className="group relative flex-1">
                <div className="w-full rounded-t-md transition hover:opacity-80"
                  style={{ height: `${(v / max) * 100}%`, minHeight: v > 0 ? '6px' : '2px', backgroundColor: 'var(--brand-primary)' }} />
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {formatMoney(v, sym)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Status breakdown */}
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">Orders by status</h2>
          <ul className="mt-4 space-y-2.5">
            {STATUSES.map(s => (
              <li key={s} className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{s}</span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-bold">{counts[s] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8 rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">Recent Orders</h2>
          <Link to="/admin/orders" className="text-xs font-bold brand-text hover:underline">View all</Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs uppercase tracking-wider text-neutral-400">
              <th className="pb-2 pr-4">Order</th><th className="pb-2 pr-4">Customer</th><th className="pb-2 pr-4">Status</th><th className="pb-2 pr-4">Total</th><th className="pb-2">Date</th>
            </tr></thead>
            <tbody>
              {orders.slice(0, 6).map(o => (
                <tr key={o.id} className="border-t border-neutral-100">
                  <td className="py-3 pr-4 font-mono text-xs font-bold">{o.order_number}</td>
                  <td className="py-3 pr-4">{o.full_name}<span className="block text-xs text-neutral-400">{o.phone}</span></td>
                  <td className="py-3 pr-4"><span className="rounded-full bg-champagne-50 px-2.5 py-1 text-xs font-semibold text-champagne-800">{o.status}</span></td>
                  <td className="py-3 pr-4 font-semibold">{formatMoney(o.total, sym)}</td>
                  <td className="py-3 text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!orders.length && <tr><td colSpan={5} className="py-8 text-center text-neutral-400">No orders yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
