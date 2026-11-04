import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Loader2, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import type { Order, OrderItem, OrderStatus, StatusHistoryEntry } from '../lib/types'
import { formatMoney } from '../lib/format'

const STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [history, setHistory] = useState<StatusHistoryEntry[]>([])
  const [note, setNote] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const load = async () => {
    const { data: o } = await supabase.from('orders').select('*').eq('id', id!).maybeSingle()
    setOrder(o as Order | null)
    setInternalNotes((o as any)?.internal_notes || '')
    const { data: it } = await supabase.from('order_items').select('*').eq('order_id', id!)
    setItems((it || []) as OrderItem[])
    const { data: h } = await supabase.from('order_status_history').select('*').eq('order_id', id!).order('created_at')
    setHistory((h || []) as StatusHistoryEntry[])
  }
  useEffect(() => { load() }, [id])

  const changeStatus = async (status: OrderStatus) => {
    if (!order) return
    setSaving(true); setMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('orders').update({ status }).eq('id', order.id)
    await supabase.from('order_status_history').insert({ order_id: order.id, status, note: note || null, changed_by: user?.id ?? null })
    setNote(''); setMsg(`Status updated to ${status}`); await load(); setSaving(false)
  }

  const saveNotes = async () => {
    if (!order) return
    setSaving(true)
    await supabase.from('orders').update({ internal_notes: internalNotes || null }).eq('id', order.id)
    setMsg('Notes saved'); setSaving(false)
  }

  if (!order) return <div className="p-10 text-neutral-500">Loading order…</div>

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="font-display text-2xl font-bold">Order {order.order_number}</h1>
            <span className="rounded-full bg-champagne-100 px-3 py-1 text-xs font-bold text-champagne-800">{order.status}</span>
          </div>
          <p className="mt-1 text-xs text-neutral-400">Placed {new Date(order.created_at).toLocaleString()} · Source: {order.source} · Payment: {order.payment_method}</p>

          <div className="mt-5">
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500">Update status</label>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} disabled={saving || order.status === s} onClick={() => changeStatus(s)}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition disabled:opacity-40 ${order.status === s ? 'text-white' : 'bg-neutral-100 hover:bg-neutral-200'}`}
                  style={order.status === s ? { backgroundColor: 'var(--brand-secondary)' } : {}}>
                  {s}
                </button>
              ))}
            </div>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="Optional note for this status change"
              className="mt-3 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none" />
            {msg && <p className="mt-2 text-sm font-semibold text-green-600">{msg}</p>}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <h2 className="font-display text-lg font-bold">Items</h2>
          <ul className="mt-4 divide-y divide-neutral-100">
            {items.map(i => (
              <li key={i.id} className="flex items-center gap-4 py-3">
                {i.product_image && <img src={i.product_image} alt="" className="h-12 w-12 rounded-lg object-cover" />}
                <div className="flex-1">
                  <p className="text-sm font-semibold">{i.product_name}</p>
                  <p className="text-xs text-neutral-400">Qty {i.quantity} × {formatMoney(i.unit_price, sym)} {Number(i.discount_unit) > 0 && <span className="text-green-600">(-{formatMoney(i.discount_unit, sym)} off, was {formatMoney(i.original_unit ?? i.unit_price, sym)})</span>}</p>
                </div>
                <span className="text-sm font-bold">{formatMoney(i.line_total, sym)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-neutral-100 pt-4 text-sm">
            <div className="flex justify-between text-neutral-500"><dt>Subtotal</dt><dd>{formatMoney(order.subtotal, sym)}</dd></div>
            {Number(order.discount_total) > 0 && <div className="flex justify-between text-green-600"><dt>Discount</dt><dd>-{formatMoney(order.discount_total, sym)}</dd></div>}
            <div className="flex justify-between text-neutral-500"><dt>Delivery</dt><dd>{formatMoney(order.delivery_charge, sym)}</dd></div>
            <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="brand-text">{formatMoney(order.total, sym)}</dd></div>
          </dl>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <h2 className="font-display text-lg font-bold">Status History</h2>
          <ul className="mt-4 space-y-3">
            {history.map(h => (
              <li key={h.id} className="flex gap-3 text-sm">
                <span className="h-2.5 w-2.5 mt-1.5 shrink-0 rounded-full" style={{ backgroundColor: 'var(--brand-primary)' }} />
                <div>
                  <p><span className="font-bold">{h.status}</span> {h.note && <span className="text-neutral-500">— {h.note}</span>}</p>
                  <p className="text-xs text-neutral-400">{new Date(h.created_at).toLocaleString()}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <h2 className="font-display text-lg font-bold">Customer</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div><dt className="text-xs uppercase text-neutral-400">Name</dt><dd className="font-semibold">{order.full_name}</dd></div>
            <div><dt className="text-xs uppercase text-neutral-400">Phone</dt><dd>{order.phone}</dd></div>
            {order.email && <div><dt className="text-xs uppercase text-neutral-400">Email</dt><dd>{order.email}</dd></div>}
            <div><dt className="text-xs uppercase text-neutral-400">Address</dt><dd>{order.address}, {order.city || ''}</dd></div>
            {order.instructions && <div><dt className="text-xs uppercase text-neutral-400">Instructions</dt><dd>{order.instructions}</dd></div>}
          </dl>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <h2 className="font-display text-lg font-bold">Internal Notes</h2>
          <textarea rows={4} value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
            className="mt-3 w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none" placeholder="Private notes (not visible to customer)" />
          <button onClick={saveNotes} disabled={saving} className="mt-3 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand-secondary)' }}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Notes
          </button>
        </div>
      </div>
    </div>
  )
}
