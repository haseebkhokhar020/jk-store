import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'
import type { Product } from '../lib/types'
import { formatMoney, priceOf } from '../lib/format'

export default function AdminProducts() {
  const { store } = useBranding()
  const sym = store?.currency_symbol || 'Rs.'
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')

  const load = () => supabase.from('products').select('*').order('created_at', { ascending: false }).then(r => setProducts(r.data || []))
  useEffect(() => { load() }, [])

  const togglePublish = async (p: Product) => {
    await supabase.from('products').update({ is_published: !p.is_published }).eq('id', p.id)
    load()
  }
  const remove = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    await supabase.from('products').delete().eq('id', p.id)
    setMsg(`Deleted ${p.name}`); load()
  }

  const filtered = products.filter(p => p.name.toLowerCase().includes(q.toLowerCase()) || p.sku?.toLowerCase().includes(q.toLowerCase()))

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <Link to="/admin/products/new" className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>
          <Plus size={16} /> Add Product
        </Link>
      </div>
      {msg && <p className="mt-3 rounded-lg bg-green-50 p-2.5 text-sm text-green-700">{msg}</p>}
      <div className="relative mt-5 max-w-sm">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search products…"
          className="w-full rounded-full border border-neutral-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none" />
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-card ring-1 ring-neutral-100">
        <table className="w-full text-left text-sm">
          <thead><tr className="text-xs uppercase tracking-wider text-neutral-400">
            <th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Discount</th><th className="p-4">Stock</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
          </tr></thead>
          <tbody>
            {filtered.map(p => {
              const pr = priceOf(p)
              return (
                <tr key={p.id} className="border-t border-neutral-100">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div><p className="font-semibold">{p.name}</p><p className="text-xs text-neutral-400">{p.sku}</p></div>
                    </div>
                  </td>
                  <td className="p-4"><span className="font-bold">{formatMoney(pr.unit, sym)}</span>{pr.onSale && <span className="ml-1.5 text-xs text-neutral-400 line-through">{formatMoney(pr.original, sym)}</span>}</td>
                  <td className="p-4 text-xs">{p.discount_active ? `${p.discount_type === 'percent' ? p.discount_value + '%' : formatMoney(p.discount_value, sym)} OFF` : '—'}</td>
                  <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.stock > 10 ? 'bg-green-100 text-green-700' : p.stock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{p.stock}</span></td>
                  <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${p.is_published ? 'bg-green-100 text-green-700' : 'bg-neutral-200 text-neutral-500'}`}>{p.is_published ? 'Published' : 'Draft'}</span></td>
                  <td className="p-4">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => togglePublish(p)} title={p.is_published ? 'Unpublish' : 'Publish'} className="rounded-lg p-2 hover:bg-neutral-100">{p.is_published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                      <Link to={`/admin/products/${p.id}`} className="rounded-lg p-2 hover:bg-neutral-100"><Pencil size={16} /></Link>
                      <button onClick={() => remove(p)} className="rounded-lg p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {!filtered.length && <tr><td colSpan={6} className="p-10 text-center text-neutral-400">No products found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
