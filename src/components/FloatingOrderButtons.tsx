import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Phone, X, Plus } from 'lucide-react'
import { useBranding } from '../lib/branding'
import { useCart } from '../lib/cart'
import { telLink, waLink } from '../lib/format'

// Floating Call / WhatsApp order buttons — visibility controlled from admin
// (contact_settings.show_on contains 'floating').
export default function FloatingOrderButtons() {
  const { contacts } = useBranding()
  const { items, subtotal } = useCart()
  const [open, setOpen] = useState(false)
  const visible = contacts.filter(c => c.is_enabled && c.show_on?.includes('floating'))
  if (!visible.length) return null

  const wa = visible.find(c => c.kind === 'whatsapp')
  const phone = visible.find(c => c.kind === 'phone')
  const msg = `Hello! I want to order from your store.\n\n${items.map(i =>
    `• ${i.product.name} x${i.quantity} — Rs.${i.product.original_price}`).join('\n')}\n\nCart total: Rs.${subtotal.toFixed(2)}\n\nPlease confirm availability. Thank you!`

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && visible.map((c, i) => (
          <motion.a
            key={c.id}
            initial={{ opacity: 0, y: 12, scale: .9 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: .9 }} transition={{ delay: i * 0.05 }}
            href={c.kind === 'whatsapp' ? waLink(c.number, msg) : telLink(c.number)}
            target={c.kind === 'whatsapp' ? '_blank' : undefined} rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-soft ring-1 ring-neutral-200"
          >
            {c.kind === 'whatsapp' ? <MessageCircle size={17} className="text-green-600" /> : <Phone size={16} className="brand-text" />}
            {c.button_label || (c.kind === 'whatsapp' ? 'WhatsApp Order' : 'Call to Order')}
          </motion.a>
        ))}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)} aria-label="Order options"
        className="brand-bg flex h-14 w-14 items-center justify-center rounded-full text-white shadow-soft transition hover:scale-105">
        {open ? <X size={22} /> : <Plus size={24} />}
      </button>
      {wa && !open && (
        <a href={waLink(wa.number, 'Hello! I have a question about your products.')} target="_blank" rel="noreferrer"
           aria-label="WhatsApp support"
           className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white shadow-soft transition hover:scale-105">
          <MessageCircle size={22} />
        </a>
      )}
      {phone && !open && null}
    </div>
  )
}
