import { useState } from 'react'
import { Check, Copy, Mail, MapPin, MessageCircle, Phone, Send } from 'lucide-react'
import { useBranding } from '../lib/branding'
import { telLink, waLink } from '../lib/format'

export default function Contact() {
  const { branding, contacts } = useBranding()
  const [copied, setCopied] = useState<string | null>(null)
  const copy = async (t: string) => {
    try { await navigator.clipboard.writeText(t); setCopied(t); setTimeout(() => setCopied(null), 1500) } catch { /* noop */ }
  }
  const phones = contacts.filter(c => c.kind === 'phone')
  const whatsapps = contacts.filter(c => c.kind === 'whatsapp')

  return (
    <div className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="font-display text-4xl font-bold sm:text-5xl">Contact <span className="brand-text">{branding?.store_name}</span></h1>
      <p className="mt-3 text-sm text-neutral-500">Questions about an order or a product? Call, WhatsApp or email us — we reply fast.</p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <h2 className="font-display text-lg font-bold">Call to Order</h2>
          {phones.length === 0 && <p className="mt-3 text-sm text-neutral-400">No phone number configured.</p>}
          <ul className="mt-4 space-y-3">
            {phones.map(c => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{c.label} {c.is_primary && <span className="brand-text text-xs">(primary)</span>}</p>
                  <p className="text-xs text-neutral-500">{c.number}</p>
                </div>
                <div className="flex gap-2">
                  <a href={telLink(c.number)} className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>
                    <Phone size={12} /> Call
                  </a>
                  <button onClick={() => copy(c.number)} className="rounded-full border border-neutral-200 p-2" title="Copy number">
                    {copied === c.number ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100">
          <h2 className="font-display text-lg font-bold">WhatsApp Support</h2>
          {whatsapps.length === 0 && <p className="mt-3 text-sm text-neutral-400">No WhatsApp number configured.</p>}
          <ul className="mt-4 space-y-3">
            {whatsapps.map(c => (
              <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl bg-cream px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{c.label} {c.is_primary && <span className="text-xs text-green-700">(primary)</span>}</p>
                  <p className="text-xs text-neutral-500">{c.number}</p>
                </div>
                <a href={waLink(c.number, `Hello ${branding?.store_name}! I need help with an order.`)} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full bg-green-500 px-4 py-2 text-xs font-bold text-white hover:bg-green-600">
                  <MessageCircle size={12} /> Chat
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-card ring-1 ring-neutral-100 md:col-span-2">
          <h2 className="font-display text-lg font-bold">Other Ways to Reach Us</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            {branding?.contact_email && (
              <p className="flex items-center gap-2"><Mail size={15} className="brand-text" /> {branding.contact_email}</p>
            )}
            {branding?.contact_address && (
              <p className="flex items-center gap-2"><MapPin size={15} className="brand-text" /> {branding.contact_address}</p>
            )}
            <p className="flex items-center gap-2"><Send size={15} className="brand-text" /> Order updates via SMS/WhatsApp on your phone number</p>
          </div>
        </div>
      </div>
    </div>
  )
}
