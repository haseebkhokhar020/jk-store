import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, Eye, Phone, Search, MessageCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import type { Order, OrderStatus } from '../lib/types'
import { formatMoney, telLink, waLink } from '../lib/format'

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
const SOURCES = ['website', 'phone', 'whatsapp', 'admin']

function toCsv(orders: Order[]) {
  const head = ['order_number', 'date', 'customer', 'phone', 'email', 'city', 'address', 'source', 'status', 'payment', 'subtotal', 'discount', 'delivery', 'total']
  const rows = orders.map(o => [o.order_number, o.created_at, o.full_name, o.phone, o.email || '', o.city || '', `"${o.address}"`, o.source, o.status, o.payment_method, o.subtotal, o.discount_total, o.delivery_charge, o.total].join(','))
  return [head.join(','), ...rows].join('\n')
}

export default function AdminOrders() {
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const [orders, setOrders] = useState<Order[]>([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [source, setSource] = useState('')

  const load = () => supabase.from('orders').select('*').order('created_at', { ascending: false }).then(r => setOrders(r.data || []))
  useEffect(() => { load() }, [])

  const filtered = orders.filter(o =>
    (!q || o.order_number.toLowerCase().includes(q.toLowerCase()) || o.full_name.toLowerCase().includes(q.toLowerCase()) || o.phone.includes(q)) &&
    (!status || o.status === status) && (!source || o.source === source))

  const exportCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  const statusColor = (s: string) => s === 'Delivered' ? 'bg-green-100 text-green-700' : s === 'Cancelled' ? 'bg-red-100 text-red-600' : s === 'Pending' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Orders</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search order / name / phone"
              className="rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none" />
          </div>
          <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none">
            <option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select value={source} onChange={e => setSource(e.target.value)} className="rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm outline-none">
            <option value="">All sources</option>{SOURCES.map(s => <option key={s}>{s}</option>)}
          </select>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-neutral-100">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-xs uppercase tracking-wider text-neutral-400">
            <th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Source</th><th className="p-4">Status</th><th className="p-4">Total</th><th className="p-4">Date</th><th className="p-4 text-right">View</th>
          </tr></thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="p-4 font-mono text-xs font-bold">{o.order_number}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-semibold">{o.full_name}</p>
                      <p className="text-xs text-neutral-400">{o.phone} · {o.city || ''}</p>
                    </div>
                    <a href={telLink(o.phone)} className="rounded-full p-1.5 hover:bg-neutral-100" title="Call customer"><Phone size={13} /></a>
                    <a href={waLink(o.phone, `Hello ${o.full_name}, this is regarding your order ${o.order_number}.`)} target="_blank" rel="noreferrer" className="rounded-full p-1.5 hover:bg-neutral-100" title="WhatsApp customer"><MessageCircle size={13} className="text-green-600" /></a>
                  </div>
                </td>
                <td className="p-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold capitalize">{o.source}</span></td>
                <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusColor(o.status)}`}>{o.status}</span></td>
                <td className="p-4 font-bold">{formatMoney(o.total, sym)}</td>
                <td className="p-4 text-xs text-neutral-500">{new Date(o.created_at).toLocaleString()}</td>
                <td className="p-4 text-right"><Link to={`/admin/orders/${o.id}`} className="inline-block rounded-lg p-2 hover:bg-neutral-100"><Eye size={16} /></Link></td>
              </tr>
            ))}
            {!filtered.length && <tr><td colSpan={7} className="p-10 text-center text-neutral-400">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
