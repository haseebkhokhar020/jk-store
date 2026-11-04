import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, ShoppingBag, X, Phone } from 'lucide-react'
import { useBranding } from '../lib/branding'
import { useCart } from '../lib/cart'
import { telLink } from '../lib/format'

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/track', label: 'Track Order' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const { branding, contacts } = useBranding()
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  useEffect(() => { setOpen(false) }, [loc.pathname])
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const logo = branding?.logo_url || null
  const primaryPhone = contacts.find(c => c.kind === 'phone' && c.is_primary) || contacts.find(c => c.kind === 'phone')
  const Logo = ({ mobile }: { mobile?: boolean }) =>
    (mobile && branding?.mobile_logo_url) || logo ? (
      <img src={((mobile && branding?.mobile_logo_url) || logo) as string} alt={branding?.store_name} className="h-9 w-auto object-contain" />
    ) : (
      <span className="font-display text-2xl font-bold tracking-tight" style={{ color: 'var(--brand-secondary)' }}>
        {branding?.store_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'JK'}
        <span className="brand-text">.</span>
      </span>
    )

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-card' : 'bg-white'}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="hidden sm:block"><Logo /></span>
          <span className="sm:hidden"><Logo mobile /></span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} className="nav-link text-sm font-medium text-neutral-700 hover:text-black">
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {primaryPhone?.is_enabled && (
            <a href={telLink(primaryPhone.number)}
               className="hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:bg-neutral-50 sm:flex"
               style={{ borderColor: 'var(--brand-primary)', color: 'var(--brand-secondary)' }}>
              <Phone size={13} className="brand-text" /> {primaryPhone.button_label || 'Call to Order'}
            </a>
          )}
          <Link to="/cart" className="relative rounded-full p-2 transition hover:bg-neutral-100" aria-label="Cart">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="brand-bg absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t bg-white md:hidden">
            <div className="flex flex-col px-6 py-4">
              {links.map(l => (
                <NavLink key={l.to} to={l.to} className="border-b border-neutral-100 py-3 text-sm font-medium">{l.label}</NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
