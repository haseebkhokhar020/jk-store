import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Boxes, LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingCart, Users, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBranding } from '../lib/branding'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const { branding } = useBranding()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/admin/login', { replace: true }); return }
      const { data: admin } = await supabase.from('admin_users').select('is_active').eq('id', user.id).maybeSingle()
      if (!admin || !admin.is_active) { await supabase.auth.signOut(); navigate('/admin/login', { replace: true }); return }
      setChecked(true)
    }
    check()
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate('/admin/login', { replace: true })
    })
    return () => { sub.subscription.unsubscribe() }
  }, [navigate])

  if (!checked) {
    return <div className="flex min-h-screen items-center justify-center"><Boxes className="animate-pulse brand-text" size={36} /></div>
  }

  const logout = async () => { await supabase.auth.signOut(); navigate('/admin/login') }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-60 transform bg-white shadow-card transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link to="/admin" className="font-display text-xl font-bold">{branding?.store_name} <span className="brand-text">Admin</span></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)}><X size={20} /></button>
        </div>
        <nav className="space-y-1 p-4">
          {nav.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${isActive ? 'text-white' : 'text-neutral-600 hover:bg-neutral-100'}`}
              style={({ isActive }) => isActive ? { backgroundColor: 'var(--brand-secondary)' } : {}}>
              <n.icon size={17} /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute inset-x-0 bottom-0 space-y-1 border-t p-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-neutral-600 hover:bg-neutral-100"><Boxes size={17} /> View Store</Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"><LogOut size={17} /> Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/90 px-5 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu size={22} /></button>
          <p className="text-sm font-semibold">{branding?.store_name} — Admin Dashboard</p>
          <Link to="/" className="text-xs font-semibold brand-text hover:underline">View store ↗</Link>
        </header>
        <main className="p-5 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
