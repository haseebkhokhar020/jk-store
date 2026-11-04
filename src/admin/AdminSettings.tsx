import { useEffect, useState } from 'react'
import { Check, ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { BrandingSettings, ContactNumber, StoreSettings } from '../lib/types'

type Tab = 'branding' | 'store' | 'contacts'

export default function AdminSettings() {
  const [tab, setTab] = useState<Tab>('branding')
  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <div className="mt-4 flex gap-2">
        {[['branding', 'Branding'], ['store', 'Store & Email'], ['contacts', 'Phones & WhatsApp']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t as Tab)}
            className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${tab === t ? 'text-white' : 'bg-white ring-1 ring-neutral-200 hover:bg-neutral-50'}`}
            style={tab === t ? { backgroundColor: 'var(--brand-secondary)' } : {}}>{l}</button>
        ))}
      </div>
      {tab === 'branding' && <BrandingTab />}
      {tab === 'store' && <StoreTab />}
      {tab === 'contacts' && <ContactsTab />}
    </div>
  )
}

/* ------------------------------ BRANDING ------------------------------ */
function BrandingTab() {
  const [b, setB] = useState<BrandingSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    supabase.from('branding_settings').select('*').limit(1).maybeSingle().then(r => {
      setB(r.data as BrandingSettings)
      if (!r.data) {
        supabase.from('branding_settings').insert({ store_name: 'JK Store', owner_name: 'Jahanzaib Khan' }).then(() =>
          supabase.from('branding_settings').select('*').limit(1).maybeSingle().then(rr => setB(rr.data as BrandingSettings)))
      }
    })
  }, [])

  const set = (k: string, v: any) => setB(prev => prev ? { ...prev, [k]: v } : prev)

  const uploadLogo = async (file: File | null, field: 'logo_url' | 'mobile_logo_url' | 'favicon_url') => {
    if (!file || !b) return
    const path = `branding/${field}-${Date.now()}.${file.name.split('.').pop()}`
    await supabase.storage.from('product-images').upload(path, file, { upsert: true })
    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    set(field, data.publicUrl)
  }

  const save = async () => {
    if (!b) return
    setSaving(true); setMsg('')
    const { id, ...rest } = b
    const { error } = await supabase.from('branding_settings').update(rest).eq('id', id)
    setMsg(error ? `Error: ${error.message}` : '✓ Saved — changes are live across the whole site instantly')
    setSaving(false)
  }

  if (!b) return <p className="mt-6 text-neutral-500">Loading…</p>
  const input = "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100"
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500"

  return (
    <div className="mt-6 max-w-3xl space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
      <p className="rounded-lg bg-champagne-50 p-3 text-xs text-champagne-800">These settings update the storefront, admin, emails and browser tab (title/favicon/meta) instantly — no code changes or redeploy needed.</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>Store Name</label><input className={input} value={b.store_name} onChange={e => set('store_name', e.target.value)} /></div>
        <div><label className={label}>Owner Name</label><input className={input} value={b.owner_name} onChange={e => set('owner_name', e.target.value)} /></div>
      </div>
      <div><label className={label}>Tagline</label><input className={input} value={b.tagline} onChange={e => set('tagline', e.target.value)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>Primary Color (hex)</label><input className={input} type="color" value={b.primary_color} onChange={e => set('primary_color', e.target.value)} /></div>
        <div><label className={label}>Secondary Color (hex)</label><input className={input} type="color" value={b.secondary_color} onChange={e => set('secondary_color', e.target.value)} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label}>Display Font</label><input className={input} value={b.font_display} onChange={e => set('font_display', e.target.value)} placeholder="Playfair Display" /></div>
        <div><label className={label}>Body Font</label><input className={input} value={b.font_body} onChange={e => set('font_body', e.target.value)} placeholder="Inter" /></div>
        <div><label className={label}>Background (hex)</label><input className={input} type="color" value={b.background_color} onChange={e => set('background_color', e.target.value)} /></div>
      </div>
      <div><label className={label}>Business Category</label><input className={input} value={b.business_category} onChange={e => set('business_category', e.target.value)} /></div>

      <div className="grid gap-4 sm:grid-cols-3">
        {(['logo_url', 'mobile_logo_url', 'favicon_url'] as const).map(f => (
          <div key={f}>
            <label className={label}>{f === 'logo_url' ? 'Logo' : f === 'mobile_logo_url' ? 'Mobile Logo' : 'Favicon'}</label>
            <input className={`${input} mb-2 text-xs`} value={b[f] || ''} onChange={e => set(f, e.target.value || null)} placeholder="URL" />
            <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-champagne-400 px-3 py-1.5 text-xs font-bold brand-text hover:bg-champagne-50">
              <ImagePlus size={12} /> Upload<input type="file" accept="image/*" className="hidden" onChange={e => uploadLogo(e.target.files?.[0] || null, f)} />
            </label>
            {b[f] && <img src={b[f]!} alt="" className="mt-2 h-10 rounded-md object-contain ring-1 ring-neutral-200" />}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>Contact Email</label><input className={input} value={b.contact_email || ''} onChange={e => set('contact_email', e.target.value || null)} /></div>
        <div><label className={label}>Contact Address</label><input className={input} value={b.contact_address || ''} onChange={e => set('contact_address', e.target.value || null)} /></div>
      </div>
      <div><label className={label}>SEO Title</label><input className={input} value={b.seo_title || ''} onChange={e => set('seo_title', e.target.value || null)} /></div>
      <div><label className={label}>SEO Description</label><textarea className={input} rows={2} value={b.seo_description || ''} onChange={e => set('seo_description', e.target.value || null)} /></div>
      <div><label className={label}>SEO Keywords</label><input className={input} value={b.seo_keywords || ''} onChange={e => set('seo_keywords', e.target.value || null)} /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className={label}>Facebook URL</label><input className={input} value={b.social_facebook || ''} onChange={e => set('social_facebook', e.target.value || null)} /></div>
        <div><label className={label}>Instagram URL</label><input className={input} value={b.social_instagram || ''} onChange={e => set('social_instagram', e.target.value || null)} /></div>
        <div><label className={label}>TikTok URL</label><input className={input} value={b.social_tiktok || ''} onChange={e => set('social_tiktok', e.target.value || null)} /></div>
        <div><label className={label}>WhatsApp Link URL</label><input className={input} value={b.social_whatsapp || ''} onChange={e => set('social_whatsapp', e.target.value || null)} /></div>
      </div>
      <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand-secondary)' }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Branding
      </button>
      {msg && <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600"><Check size={15} /> {msg}</p>}
    </div>
  )
}

/* ------------------------------ STORE ------------------------------ */
function StoreTab() {
  const [s, setS] = useState<StoreSettings | null>(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    supabase.from('store_settings').select('*').limit(1).maybeSingle().then(r => {
      setS(r.data as StoreSettings)
      if (!r.data) supabase.from('store_settings').insert({}).then(() =>
        supabase.from('store_settings').select('*').limit(1).maybeSingle().then(rr => setS(rr.data as StoreSettings)))
    })
  }, [])
  const set = (k: string, v: any) => setS(prev => prev ? { ...prev, [k]: v } : prev)
  const save = async () => {
    if (!s) return
    setSaving(true); setMsg('')
    const { id, ...rest } = s
    const { error } = await supabase.from('store_settings').update({
      ...rest,
      delivery_charge: Number(s.delivery_charge),
      free_delivery_threshold: s.free_delivery_threshold === null || s.free_delivery_threshold === ('' as any) ? null : Number(s.free_delivery_threshold),
      min_order_amount: Number(s.min_order_amount),
    }).eq('id', id)
    setMsg(error ? `Error: ${error.message}` : '✓ Saved')
    setSaving(false)
  }
  if (!s) return <p className="mt-6 text-neutral-500">Loading…</p>
  const input = "w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm outline-none focus:border-champagne-400 focus:ring-2 focus:ring-champagne-100"
  const label = "mb-1.5 block text-xs font-bold uppercase tracking-wider text-neutral-500"
  return (
    <div className="mt-6 max-w-3xl space-y-5 rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
      <p className="rounded-lg bg-champagne-50 p-3 text-xs text-champagne-800">The notification email below receives a full order summary (ID, customer, items, prices, discounts, delivery, total) for every order — change it any time without touching code.</p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label}>Currency Symbol</label><input className={input} value={s.currency_symbol} onChange={e => set('currency_symbol', e.target.value)} /></div>
        <div><label className={label}>Currency Code</label><input className={input} value={s.currency_code} onChange={e => set('currency_code', e.target.value)} /></div>
        <div><label className={label}>Order ID Prefix</label><input className={input} value={s.order_prefix} onChange={e => set('order_prefix', e.target.value)} /></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div><label className={label}>Delivery Charge</label><input className={input} type="number" value={s.delivery_charge} onChange={e => set('delivery_charge', Number(e.target.value))} /></div>
        <div><label className={label}>Free Delivery Above (blank = never)</label><input className={input} type="number" value={s.free_delivery_threshold ?? ''} onChange={e => set('free_delivery_threshold', e.target.value === '' ? null : Number(e.target.value))} /></div>
        <div><label className={label}>Min Order Amount</label><input className={input} type="number" value={s.min_order_amount} onChange={e => set('min_order_amount', Number(e.target.value))} /></div>
      </div>
      <div><label className={label}>Admin Notification Email (Resend)</label><input className={input} type="email" value={s.notify_email} onChange={e => set('notify_email', e.target.value)} /></div>
      <label className="flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={s.maintenance_mode} onChange={e => set('maintenance_mode', e.target.checked)} className="h-4 w-4 accent-yellow-600" />
        Maintenance mode
      </label>
      <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white disabled:opacity-60" style={{ backgroundColor: 'var(--brand-secondary)' }}>
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save Store Settings
      </button>
      {msg && <p className="flex items-center gap-1.5 text-sm font-semibold text-green-600"><Check size={15} /> {msg}</p>}
    </div>
  )
}

/* ------------------------------ CONTACTS ------------------------------ */
const SHOW_OPTIONS = ['product', 'cart', 'checkout', 'floating', 'contact']

function ContactsTab() {
  const [rows, setRows] = useState<ContactNumber[]>([])
  const [msg, setMsg] = useState('')
  const load = () => supabase.from('contact_settings').select('*').order('sort_order').then(r => setRows(r.data || []))
  useEffect(() => { load() }, [])

  const add = async (kind: 'phone' | 'whatsapp') => {
    await supabase.from('contact_settings').insert({
      kind, label: kind === 'phone' ? 'Phone' : 'WhatsApp', number: '+92',
      show_on: ['product', 'cart', 'checkout', 'floating'], sort_order: rows.length,
    })
    setMsg('Added — edit the number and save'); load()
  }
  const update = async (row: ContactNumber) => {
    const { id, ...rest } = row
    await supabase.from('contact_settings').update(rest).eq('id', id)
    setMsg('✓ Saved'); load()
  }
  const remove = async (row: ContactNumber) => {
    if (!confirm('Delete this number?')) return
    await supabase.from('contact_settings').delete().eq('id', row.id); load()
  }
  const toggleShow = (row: ContactNumber, opt: string) => {
    const show_on = row.show_on.includes(opt) ? row.show_on.filter(s => s !== opt) : [...row.show_on, opt]
    update({ ...row, show_on })
  }

  return (
    <div className="mt-6 max-w-4xl space-y-4">
      <div className="flex gap-3">
        <button onClick={() => add('phone')} className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}><Plus size={15} /> Add Phone</button>
        <button onClick={() => add('whatsapp')} className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-600"><Plus size={15} /> Add WhatsApp</button>
      </div>
      {msg && <p className="text-sm font-semibold text-green-600">{msg}</p>}
      {rows.map(row => (
        <div key={row.id} className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-neutral-100">
          <div className="grid gap-3 sm:grid-cols-4">
            <div><label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Type</label>
              <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${row.kind === 'whatsapp' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{row.kind}</span></div>
            <div><label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Label</label>
              <input className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" value={row.label} onChange={e => update({ ...row, label: e.target.value })} onBlur={() => update(row)} /></div>
            <div><label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Number (e.g. +923001234567)</label>
              <input className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" value={row.number} onChange={e => setRows(rs => rs.map(r => r.id === row.id ? { ...r, number: e.target.value } : r))} onBlur={() => update(row)} /></div>
            <div><label className="mb-1 block text-xs font-bold uppercase text-neutral-400">Button label</label>
              <input className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm" value={row.button_label || ''} placeholder={row.kind === 'whatsapp' ? 'Order on WhatsApp' : 'Call to Order'} onChange={e => setRows(rs => rs.map(r => r.id === row.id ? { ...r, button_label: e.target.value } : r))} onBlur={() => update(row)} /></div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-yellow-600" checked={row.is_enabled} onChange={e => update({ ...row, is_enabled: e.target.checked })} /> Enabled</label>
            <label className="flex items-center gap-1.5 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-yellow-600" checked={row.is_primary} onChange={e => update({ ...row, is_primary: e.target.checked })} /> Primary</label>
            <span className="text-xs font-bold uppercase text-neutral-400">Show on:</span>
            {SHOW_OPTIONS.map(o => (
              <button key={o} onClick={() => toggleShow(row, o)}
                className={`rounded-full px-3 py-1 text-xs font-bold ${row.show_on.includes(o) ? 'text-white' : 'bg-neutral-100 text-neutral-500'}`}
                style={row.show_on.includes(o) ? { backgroundColor: 'var(--brand-primary)' } : {}}>{o}</button>
            ))}
            <button onClick={() => remove(row)} className="ml-auto rounded-full p-2 text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
          </div>
        </div>
      ))}
    </div>
  )
}
