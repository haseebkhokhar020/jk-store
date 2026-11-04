// GET /api/track?order=JK-...&phone=+92... — public order tracking.
// Uses the security-definer RPC that matches BOTH order number and phone,
// so one customer can never see another customer's order.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminClient, cors, json } from './_shared'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })
  try {
    const order = String(req.query.order || '').trim().slice(0, 40)
    const phone = String(req.query.phone || '').replace(/\s+/g, '').slice(0, 20)
    if (!order || !phone) return json(res, 400, { error: 'Order ID and phone number are required' })
    const supa = adminClient()
    const { data, error } = await supa.rpc('track_order', { p_order_number: order, p_phone: phone })
    if (error) throw error
    if (!data || data.length === 0) return json(res, 404, { error: 'No order found with that ID and phone number' })
    return json(res, 200, { ok: true, order: data[0] })
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Tracking failed' })
  }
}
