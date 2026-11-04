import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ImagePlus, Loader2, Save, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Category, Product } from '../lib/types'

const empty = {
  name: '', slug: '', description: '', short_description: '', specifications: '{}',
  images: '', category_id: '', original_price: '2000', selling_price: '',
  discount_type: '', discount_value: '', discount_active: false,
  discount_start: '', discount_end: '', stock: '10', sku: '', tags: '', is_published: true, is_featured: false,
}

export default function AdminProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState<any>(empty)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase.from('categories').select('*').order('name').then(r => setCategories(r.data || []))
    if (id) {
      setLoading(true)
      supabase.from('products').select('*').eq('id', id).maybeSingle().then(r => {
        if (r.data) {
          const p = r.data as Product
          setForm({
            ...empty, ...p,
            specifications: JSON.stringify(p.specifications || {}),
            images: (p.images || []).join('\n'),
            tags: (p.tags || []).join(', '),
            discount_type: p.discount_type || '', discount_value: p.discount_value ?? '',
            original_price: String(p.original_price), selling_price: p.selling_price ?? '',
            stock: String(p.stock),
            discount_start: p.discount_start ? p.discount_start.slice(0, 16) : '',
            discount_end: p.discount_end ? p.discount_end.slice(0, 16) : '',
          })
        }
        setLoading(false)
      })
    }
  }, [id])

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return
    setSaving(true)
    const urls: string[] = []
    for (const f of Array.from(files)) {
      const path = `products/${Date.now()}-${f.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, f, { upsert: true })
      if (upErr) { setError(`Upload failed: ${upErr.message}`); continue }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      urls.push(data.publicUrl)
    }
    set('images', [form.images, ...urls].filter(Boolean).join('\n'))
    setSaving(false)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) { setError('Product name is required'); return }
    setSaving(true)
    try {
      const slug = form.slug.trim() || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      let specs = {}
      try { specs = JSON.parse(form.specifications || '{}') } catch { throw new Error('Specifications must be valid JSON, e.g. {"Size":"200ml"}') }
      const payload = {
        name: form.name.trim(), slug,
        description: form.description || null, short_description: form.short_description || null,
        specifications: specs,
        images: String(form.images).split('\n').map(s => s.trim()).filter(Boolean),
        category_id: form.category_id || null,
        original_price: Number(form.original_price) || 0,
        selling_price: form.selling_price === '' ? null : Number(form.selling_price),
        discount_type: form.discount_type || null,
        discount_value: form.discount_value === '' ? null : Number(form.discount_value),
        discount_active: !!form.discount_active,
        discount_start: form.discount_start ? new Date(form.discount_start).toISOString() : null,
        discount_end: form.discount_end ? new Date(form.discount_end).toISOString() : null,
        stock: Number(form.stock) || 0, sku: form.sku || null,
        tags: String(form.tags).split(',').map(s => s.trim()).filter(Boolean),
        is_published: !!form.is_published, is_featured: !!form.is_featured,
      }
      const q = id
        ? supabase.from('products').update(payload).eq('id', id)
        : supabase.from('products').insert(payload)
      const { error: err } = await q
      if (err) throw err
      navigate('/admin/products')
    } catch (err: any) {
      setError(err?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const input = "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100"
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500"

  if (loading) return <div className="p-10 text-neutral-500">Loading…</div>

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold">{id ? 'Edit Product' : 'Add Product'}</h1>
      <form onSubmit={save} className="mt-6 space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
        {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className={label}>Name *</label><input className={input} value={form.name} onChange={e => set('name', e.target.value)} /></div>
          <div><label className={label}>Slug</label><input className={input} value={form.slug} onChange={e => set('slug', e.target.value)} placeholder="auto from name" /></div>
        </div>
        <div><label className={label}>Short description</label><input className={input} value={form.short_description} onChange={e => set('short_description', e.target.value)} /></div>
        <div><label className={label}>Full description</label><textarea className={input} rows={4} value={form.description} onChange={e => set('description', e.target.value)} /></div>
        <div><label className={label}>Specifications (JSON)</label><textarea className={`${input} font-mono text-xs`} rows={4} value={form.specifications} onChange={e => set('specifications', e.target.value)} /></div>

        <div>
          <label className={label}>Images (one URL per line)</label>
          <textarea className={`${input} font-mono text-xs`} rows={3} value={form.images} onChange={e => set('images', e.target.value)} />
          <label className="mt-2 flex w-fit cursor-pointer items-center gap-2 rounded-full border border-dashed border-champagne-400 px-4 py-2 text-xs font-bold brand-text hover:bg-champagne-50">
            <ImagePlus size={14} /> Upload images
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadImages(e.target.files)} />
          </label>
          {form.images && (
            <div className="mt-3 flex flex-wrap gap-2">
              {String(form.images).split('\n').filter(Boolean).map((u: string, i: number) => (
                <div key={i} className="relative">
                  <img src={u} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  <button type="button" onClick={() => set('images', String(form.images).split('\n').filter((_: string, j: number) => j !== i).join('\n'))}
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"><Trash2 size={10} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={label}>Category</label>
            <select className={input} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
              <option value="">— none —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div><label className={label}>Original Price (MRP)</label><input className={input} type="number" min="0" step="0.01" value={form.original_price} onChange={e => set('original_price', e.target.value)} /></div>
          <div><label className={label}>Custom Selling Price</label><input className={input} type="number" min="0" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} placeholder="optional" /></div>
        </div>

        <div className="grid gap-4 rounded-xl bg-cream p-4 sm:grid-cols-4">
          <div><label className={label}>Discount type</label>
            <select className={input} value={form.discount_type} onChange={e => set('discount_type', e.target.value)}>
              <option value="">None</option><option value="percent">Percent %</option><option value="fixed">Fixed amount</option>
            </select></div>
          <div><label className={label}>Value</label><input className={input} type="number" min="0" step="0.01" value={form.discount_value} onChange={e => set('discount_value', e.target.value)} placeholder="e.g. 20" /></div>
          <div><label className={label}>Starts</label><input className={input} type="datetime-local" value={form.discount_start} onChange={e => set('discount_start', e.target.value)} /></div>
          <div><label className={label}>Ends</label><input className={input} type="datetime-local" value={form.discount_end} onChange={e => set('discount_end', e.target.value)} /></div>
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-4">
            <input type="checkbox" checked={form.discount_active} onChange={e => set('discount_active', e.target.checked)} className="h-4 w-4 accent-yellow-600" />
            Discount active (sale scheduled/visible)
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className={label}>Stock</label><input className={input} type="number" min="0" value={form.stock} onChange={e => set('stock', e.target.value)} /></div>
          <div><label className={label}>SKU</label><input className={input} value={form.sku} onChange={e => set('sku', e.target.value)} /></div>
          <div><label className={label}>Tags (comma separated)</label><input className={input} value={form.tags} onChange={e => set('tags', e.target.value)} /></div>
        </div>

        <div className="flex gap-6 text-sm font-semibold">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} className="h-4 w-4 accent-yellow-600" /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="h-4 w-4 accent-yellow-600" /> Featured on homepage</label>
        </div>

        <div className="flex gap-3">
          <button disabled={saving} className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand-secondary)' }}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Product
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="rounded-full border px-7 py-3 text-sm font-semibold">Cancel</button>
        </div>
      </form>
    </div>
  )
}
