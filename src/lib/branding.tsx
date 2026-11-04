import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import type { BrandingSettings, StoreSettings, ContactNumber } from './types'

interface BrandingState {
  branding: BrandingSettings | null
  store: StoreSettings | null
  contacts: ContactNumber[]
  loading: boolean
  refresh: () => Promise<void>
}

const BrandingCtx = createContext<BrandingState>({
  branding: null, store: null, contacts: [], loading: true, refresh: async () => {},
})

export const useBranding = () => useContext(BrandingCtx)

const DEFAULT_BRANDING: BrandingSettings = {
  id: 'default', store_name: 'JK Store', owner_name: 'Jahanzaib Khan',
  tagline: 'Premium Cosmetics & Beauty', logo_url: null, mobile_logo_url: null, favicon_url: null,
  primary_color: '#C9A227', secondary_color: '#111111', background_color: '#FFFFFF',
  font_display: 'Playfair Display', font_body: 'Inter', business_category: 'Cosmetics & Beauty',
  contact_email: null, contact_address: null, seo_title: null, seo_description: null, seo_keywords: null,
  social_facebook: null, social_instagram: null, social_tiktok: null, social_whatsapp: null,
}

function applyBrandingToDocument(b: BrandingSettings) {
  document.title = b.seo_title || b.store_name
  const setMeta = (id: string, content: string) => {
    let el = document.getElementById(id) as HTMLMetaElement | null
    if (!el) { el = document.createElement('meta'); el.id = id; document.head.appendChild(el) }
    el.setAttribute('content', content)
  }
  const desc = b.seo_description || `${b.store_name} — ${b.tagline}`
  setMeta('app-description', desc)
  setMeta('app-og-title', b.seo_title || b.store_name)
  setMeta('app-og-desc', desc)
  const ogSite = document.getElementById('app-og-site') as HTMLMetaElement | null
  if (ogSite) ogSite.setAttribute('content', b.store_name)
  const fav = document.getElementById('app-favicon') as HTMLLinkElement | null
  if (fav && b.favicon_url) fav.setAttribute('href', b.favicon_url)
  // CSS variables drive Tailwind-independent dynamic theming
  const root = document.documentElement
  root.style.setProperty('--brand-primary', b.primary_color)
  root.style.setProperty('--brand-secondary', b.secondary_color)
  root.style.setProperty('--brand-bg', b.background_color)
  root.style.setProperty('--brand-font-display', `'${b.font_display}', Georgia, serif`)
  root.style.setProperty('--brand-font-body', `'${b.font_body}', Inter, system-ui, sans-serif`)
  document.body.style.backgroundColor = b.background_color
}

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [store, setStore] = useState<StoreSettings | null>(null)
  const [contacts, setContacts] = useState<ContactNumber[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = async () => {
    try {
      const [b, s, c] = await Promise.all([
        supabase.from('branding_settings').select('*').limit(1).maybeSingle(),
        supabase.from('store_settings').select('*').limit(1).maybeSingle(),
        supabase.from('contact_settings').select('*').eq('is_enabled', true).order('sort_order'),
      ])
      const merged = { ...DEFAULT_BRANDING, ...(b.data || {}) } as BrandingSettings
      setBranding(merged)
      setStore(s.data as StoreSettings | null)
      setContacts((c.data || []) as ContactNumber[])
      applyBrandingToDocument(merged)
    } catch (e) {
      console.error('branding load failed', e)
      applyBrandingToDocument(DEFAULT_BRANDING)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // Realtime: admin edits instantly propagate to every open visitor tab.
    const ch = supabase
      .channel('branding-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'branding_settings' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'store_settings' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contact_settings' }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  return (
    <BrandingCtx.Provider value={{ branding, store, contacts, loading, refresh }}>
      {children}
    </BrandingCtx.Provider>
  )
}
