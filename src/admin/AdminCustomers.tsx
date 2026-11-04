import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import type { Customer, Order } from '../lib/types'
import { formatMoney } from '../lib/format'

export default function AdminCustomers() {
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<Customer | null>(null)

  useEffect(() => {
    supabase.from('customers').select('*').order('total_spent', { ascending: false }).then(r => setCustomers(r.data || []))
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(500).then(r => setOrders(r.data || []))
  }, [])

  const filtered = customers.filter(c =>
    !q || c.full_name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q) || (c.email || '').includes(q.toLowerCase()))

  const selectedOrders = selected ? orders.filter(o => o.customer_id === selected.id || o.phone === selected.phone) : []

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Customers</h1>
      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name / phone / email"
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none" />
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-5">
        <div className="overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-neutral-100 lg:col-span-3">
          <table className="w-full text-left text-sm">
            <thead><tr className="text-xs uppercase tracking-wider text-neutral-400">
              <th className="p-4">Customer</th><th className="p-4">Orders</th><th className="p-4">Spent</th><th className="p-4">Joined</th>
            </tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className={`cursor-pointer border-t border-neutral-100 hover:bg-neutral-50 ${selected?.id === c.id ? 'bg-champagne-50' : ''}`}>
                  <td className="p-4"><p className="font-semibold">{c.full_name}</p><p className="text-xs text-neutral-400">{c.phone}{c.email ? ` · ${c.email}` : ''}</p></td>
                  <td className="p-4"><span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold">{c.total_orders}</span></td>
                  <td className="p-4 font-bold brand-text">{formatMoney(c.total_spent, sym)}</td>
                  <td className="p-4 text-xs text-neutral-500">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!filtered.length && <tr><td colSpan={4} className="p-10 text-center text-neutral-400">No customers yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="h-fit rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100 lg:col-span-2">
          <h2 className="font-display text-lg font-bold">{selected ? selected.full_name : 'Select a customer'}</h2>
          {selected && (
            <div className="mt-3">
              <dl className="space-y-1.5 text-sm">
                <div><dt className="text-xs uppercase text-neutral-400">Phone</dt><dd>{selected.phone}</dd></div>
                {selected.email && <div><dt className="text-xs uppercase text-neutral-400">Email</dt><dd>{selected.email}</dd></div>}
                <div><dt className="text-xs uppercase text-neutral-400">City</dt><dd>{selected.city || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-neutral-400">Address</dt><dd>{selected.address || '—'}</dd></div>
                <div><dt className="text-xs uppercase text-neutral-400">Orders</dt><dd className="font-bold">{selectedOrders.length}</dd></div>
                <div><dt className="text-xs uppercase text-neutral-400">Total spent</dt><dd className="font-bold brand-text">{formatMoney(selectedOrders.reduce((s, o) => s + Number(o.total), 0), sym)}</dd></div>
              </dl>
              <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-neutral-400">Order history</h3>
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {selectedOrders.map(o => (
                  <li key={o.id} className="rounded-xl bg-neutral-50 px-3 py-2 text-xs">
                    <span className="font-mono font-bold">{o.order_number}</span> · {o.status} · <span className="font-bold">{formatMoney(o.total, sym)}</span>
                    <span className="block text-neutral-400">{new Date(o.created_at).toLocaleString()}</span>
                  </li>
                ))}
                {!selectedOrders.length && <li className="text-xs text-neutral-400">No orders yet.</li>}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
