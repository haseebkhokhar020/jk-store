import { useState } from 'react'
import { Check, Copy, MessageCircle, Phone } from 'lucide-react'
import { useBranding } from '../lib/branding'
import type { Product } from '../lib/types'
import { priceOf, telLink, waLink } from '../lib/format'

// Call-to-Order + WhatsApp ordering buttons for a given context ('product' | 'cart' | 'checkout').
export default function OrderButtons({ where, product, qty = 1, label }: {
  where: string
  product?: Product
  qty?: number
  label?: string
}) {
  const { contacts, store } = useBranding()
  const [copied, setCopied] = useState<string | null>(null)
  const shown = contacts.filter(c => c.is_enabled && c.show_on?.includes(where))
  if (!shown.length) return null

  const sym = store?.currency_symbol || 'Rs.'
  const copy = async (n: string) => {
    try { await navigator.clipboard.writeText(n); setCopied(n); setTimeout(() => setCopied(null), 1500) } catch { /* clipboard unavailable */ }
  }

  const msg = product
    ? `Hello! I'd like to order:\n\n🛍️ ${product.name}\n💰 Price: ${sym}${priceOf(product).unit.toFixed(2)} (MRP ${sym}${priceOf(product).original.toFixed(2)})\n🔢 Quantity: ${qty}\n🔗 ${window.location.origin}/product/${product.slug}\n\nPlease confirm and share delivery details. Thank you!`
    : `${label || 'Hello! I have an inquiry about an order.'}`

  return (
    <div className="flex flex-wrap items-center gap-3">
      {shown.map(c => c.kind === 'phone' ? (
        <div key={c.id} className="flex items-center gap-2">
          <a href={telLink(c.number)}
             className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
             style={{ backgroundColor: 'var(--brand-secondary)' }}>
            <Phone size={15} /> {c.button_label || 'Call to Order'}
          </a>
          <button onClick={() => copy(c.number)} title={`Copy ${c.number}`}
            className="rounded-full border border-neutral-300 p-2.5 transition hover:bg-neutral-100">
            {copied === c.number ? <Check size={15} className="text-green-600" /> : <Copy size={15} />}
          </button>
          <span className="hidden text-xs text-neutral-500 sm:inline">{c.number}</span>
        </div>
      ) : (
        <a key={c.id} href={waLink(c.number, msg)} target="_blank" rel="noreferrer"
           className="flex items-center gap-2 rounded-full bg-green-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-600">
          <MessageCircle size={15} /> {c.button_label || 'Order on WhatsApp'}
        </a>
      ))}
    </div>
  )
}
