// POST /api/retry-email { notification_id } — admin-only retry of a failed email.
// Verified against Supabase auth: caller must be an active admin.
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminClient, cors, json, sendResendEmail } from './_shared.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })
  try {
    const auth = req.headers.authorization || ''
    const token = auth.replace(/^Bearer /i, '')
    if (!token) return json(res, 401, { error: 'Unauthorized' })
    const supa = adminClient()
    const { data: userData, error: uErr } = await supa.auth.getUser(token)
    if (uErr || !userData?.user) return json(res, 401, { error: 'Unauthorized' })
    const { data: admin } = await supa.from('admin_users').select('id, is_active').eq('id', userData.user.id).maybeSingle()
    if (!admin || !admin.is_active) return json(res, 403, { error: 'Not an admin' })

    const { notification_id } = (req.body ?? {}) as any
    const { data: n } = await supa.from('email_notifications').select('*').eq('id', notification_id).maybeSingle()
    if (!n) return json(res, 404, { error: 'Notification not found' })
    const { data: order } = await supa.from('orders').select('order_number, full_name').eq('id', n.order_id).maybeSingle()
    const subject = `${n.kind === 'customer_confirmation' ? 'Order Confirmed' : 'New Order'} ${order?.order_number ?? ''}`
    await sendResendEmail(n.recipient, subject, `<p>Order update for <b>${order?.order_number ?? ''}</b> (${order?.full_name ?? ''}). Please log in to your JK Store account/admin for full details.</p>`)
    await supa.from('email_notifications').update({ status: 'sent', attempts: (n.attempts ?? 0) + 1, last_attempt: new Date().toISOString(), error: null }).eq('id', n.id)
    return json(res, 200, { ok: true })
  } catch (e: any) {
    return json(res, 500, { error: e?.message || 'Retry failed' })
  }
}
