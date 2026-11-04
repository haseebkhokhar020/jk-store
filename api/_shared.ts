// Shared server-side helpers for Vercel serverless functions.
// These run ONLY on the server — the service role key and Resend key
// are never exposed to the browser.
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export function adminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY env vars')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export type Json = Record<string, unknown>

export function json(res: any, status: number, body: Json) {
  res.status(status).json(body)
}

export function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

// Final unit price for a product, honouring scheduled/active discounts.
export function finalUnitPrice(p: {
  original_price: number
  selling_price: number | null
  discount_active: boolean
  discount_type: string | null
  discount_value: number | null
  discount_start: string | null
  discount_end: string | null
}): { unit: number; original: number; discount: number } {
  const original = Number(p.original_price) || 0
  let unit = p.selling_price != null && Number(p.selling_price) > 0 ? Number(p.selling_price) : original
  let discount = Math.max(0, original - unit)
  if (p.discount_active && p.discount_type && p.discount_value != null) {
    const now = new Date()
    const startOk = !p.discount_start || new Date(p.discount_start) <= now
    const endOk = !p.discount_end || new Date(p.discount_end) >= now
    if (startOk && endOk) {
      const d = p.discount_type === 'percent'
        ? (original * Number(p.discount_value)) / 100
        : Number(p.discount_value)
      const discounted = Math.max(0, original - Math.min(d, original))
      if (discounted < unit) {
        discount = original - discounted
        unit = discounted
      }
    }
  }
  return { unit: Math.round(unit * 100) / 100, original, discount: Math.round(discount * 100) / 100 }
}

export function genOrderNumber(prefix: string): string {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${ymd}-${rand}`
}

export async function sendResendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL || 'JK Store <onboarding@resend.dev>'
  if (!apiKey) throw new Error('Missing RESEND_API_KEY')
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  })
  const data = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`Resend ${r.status}: ${JSON.stringify(data)}`)
  return data
}
