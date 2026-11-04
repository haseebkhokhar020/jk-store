import { Link } from 'react-router-dom'
import { Facebook, Instagram, Mail, MapPin, MessageCircle } from 'lucide-react'
import { useBranding } from '../lib/branding'

export default function Footer() {
  const { branding, contacts } = useBranding()
  const b = branding
  const year = new Date().getFullYear()
  return (
    <footer className="mt-20 text-white" style={{ backgroundColor: 'var(--brand-secondary)' }}>
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="font-display text-2xl font-bold">
            {b?.store_name || 'JK Store'} <span className="brand-text">.</span>
          </div>
          <p className="mt-3 text-sm text-neutral-400">{b?.tagline}</p>
          <p className="mt-1 text-xs text-neutral-500">Proprietor: {b?.owner_name}</p>
          <div className="mt-4 flex gap-3">
            {b?.social_facebook && <a href={b.social_facebook} target="_blank" rel="noreferrer" className="transition hover:opacity-70"><Facebook size={18} /></a>}
            {b?.social_instagram && <a href={b.social_instagram} target="_blank" rel="noreferrer" className="transition hover:opacity-70"><Instagram size={18} /></a>}
            {b?.social_whatsapp && <a href={b.social_whatsapp} target="_blank" rel="noreferrer" className="transition hover:opacity-70"><MessageCircle size={18} /></a>}
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider brand-text">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            <li><Link to="/shop" className="hover:text-white">All Products</Link></li>
            <li><Link to="/shop?category=hair-care" className="hover:text-white">Hair Care</Link></li>
            <li><Link to="/track" className="hover:text-white">Track Order</Link></li>
            <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider brand-text">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/admin" className="hover:text-white">Admin</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wider brand-text">Contact</h4>
          <ul className="mt-4 space-y-2 text-sm text-neutral-400">
            {b?.contact_email && <li className="flex items-center gap-2"><Mail size={14} className="brand-text" /> {b.contact_email}</li>}
            {b?.contact_address && <li className="flex items-center gap-2"><MapPin size={14} className="brand-text" /> {b.contact_address}</li>}
            {contacts.filter(c => c.kind === 'phone').slice(0, 2).map(c => (
              <li key={c.id} className="flex items-center gap-2">📞 {c.label}: {c.number}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-neutral-500">
        © {year} {b?.store_name || 'JK Store'} — {b?.business_category}. All rights reserved. Made with care by {b?.owner_name}.
      </div>
    </footer>
  )
}
