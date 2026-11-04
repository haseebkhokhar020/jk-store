// POST /api/checkout — guest checkout (no registration required).
// - Validates input, computes ALL prices server-side from the DB (never trusts the client)
// - Prevents duplicate orders via a unique client_order_id (idempotency)
// - Creates/updates customer, order, order_items (price snapshots), status history
// - Triggers admin + customer email notifications via Resend
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { adminClient, cors, finalUnitPrice, genOrderNumber, json, sendResendEmail } from './_shared.js'

type Item = { product_id: string; quantity: number }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  cors(res)
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true })
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  try {
    const b = (req.body ?? {}) as any
    const items: Item[] = Array.isArray(b.items) ? b.items : []
    const clientOrderId = String(b.client_order_id || '').slice(0, 80)
    if (!clientOrderId) return json(res, 400, { error: 'Missing client_order_id' })
    if (!items.length || items.some(i => !i.product_id || !(Number(i.quantity) > 0)))
      return json(res, 400, { error: 'Invalid items' })

    const fullName = String(b.full_name || '').trim().slice(0, 120)
    const phone = String(b.phone || '').replace(/\s+/g, '').slice(0, 20)
    const email = b.email ? String(b.email).trim().slice(0, 160) : null
    const city = String(b.city || '').trim().slice(0, 80)
    const address = String(b.address || '').trim().slice(0, 300)
    const instructions = b.instructions ? String(b.instructions).trim().slice(0, 500) : null
    const source = ['website', 'phone', 'whatsapp', 'admin'].includes(b.source) ? b.source : 'website'
    if (!fullName || !phone || !address) return json(res, 400, { error: 'Name, phone and address are required' })

    const supa = adminClient()

    // If the customer is logged in, verify their JWT and link the order to their account
    let userId: string | null = null
    const authHeader = String(req.headers.authorization || '')
    if (authHeader.startsWith('Bearer ')) {
      const { data: ud } = await supa.auth.getUser(authHeader.slice(7))
      if (ud?.user) userId = ud.user.id
    }

    // Idempotency: a retry with the same client_order_id returns the existing order.
    const { data: existing } = await supa.from('orders').select('id, order_number').eq('client_order_id', clientOrderId).maybeSingle()
    if (existing) return json(res, 200, { ok: true, order_number: existing.order_number, duplicate: true })

    // Server-side price calculation
    const ids = items.map(i => i.product_id)
    const { data: products, error: pErr } = await supa.from('products').select('*').in('id', ids)
    if (pErr) throw pErr
    const byId = new Map((products || []).map(p => [p.id, p]))

    let subtotal = 0, discountTotal = 0
    const lines = items.map(i => {
      const p = byId.get(i.product_id)
      if (!p || !p.is_published) throw new Error(`Product unavailable: ${i.product_id}`)
      if (p.stock < i.quantity) throw new Error(`Insufficient stock for ${p.name}`)
      const q = Math.min(99, Math.floor(Number(i.quantity)))
      const { unit, original, discount } = finalUnitPrice(p)
      const line = Math.round(unit * q * 100) / 100
      subtotal += line
      discountTotal += Math.round(discount * q * 100) / 100
      return { product: p, quantity: q, unit, original, discount, line }
    })
    subtotal = Math.round(subtotal * 100) / 100
    discountTotal = Math.round(discountTotal * 100) / 100

    const { data: settings } = await supa.from('store_settings').select('*').limit(1).maybeSingle()
    const delivery = settings?.free_delivery_threshold != null && subtotal >= Number(settings.free_delivery_threshold)
      ? 0 : Number(settings?.delivery_charge ?? 200)
    const total = Math.round((subtotal + delivery) * 100) / 100

    const prefix = settings?.order_prefix || 'JK'
    let orderNumber = genOrderNumber(prefix)
    // ensure uniqueness (extremely unlikely collision)
    const { data: clash } = await supa.from('orders').select('id').eq('order_number', orderNumber).maybeSingle()
    if (clash) orderNumber = genOrderNumber(prefix)

    // Upsert customer by phone
    let customerId: string | null = null
    const { data: cust } = await supa.from('customers').select('id').eq('phone', phone).maybeSingle()
    if (cust) {
      customerId = cust.id
      await supa.from('customers').update({
        full_name: fullName, email: email ?? undefined, city: city || null, address: address || null,
        user_id: userId ?? (cust as any).user_id ?? null, updated_at: new Date().toISOString(),
      }).eq('id', cust.id)
    } else {
      const { data: nc, error: ncErr } = await supa.from('customers').insert({
        full_name: fullName, phone, email, city: city || null, address: address || null, user_id: userId,
      }).select('id').single()
      if (ncErr) throw ncErr
      customerId = nc.id
    }

    const { data: order, error: oErr } = await supa.from('orders').insert({
      order_number: orderNumber, client_order_id: clientOrderId, customer_id: customerId, user_id: userId,
      full_name: fullName, phone, email, city: city || null, address, instructions,
      source, status: 'Pending', payment_method: 'COD',
      subtotal, discount_total: discountTotal, delivery_charge: delivery, total,
    }).select('*').single()
    if (oErr) throw oErr

    const rows = lines.map(l => ({
      order_id: order.id, product_id: l.product.id, product_name: l.product.name,
      product_image: l.product.images?.[0] ?? null, quantity: l.quantity,
      unit_price: l.unit, original_unit: l.original, discount_unit: l.discount, line_total: l.line,
    }))
    const { error: iErr } = await supa.from('order_items').insert(rows)
    if (iErr) throw iErr

    await supa.from('order_status_history').insert({ order_id: order.id, status: 'Pending', note: `Order placed via ${source}` })

    // Decrement stock
    for (const l of lines) {
      await supa.from('products').update({ stock: Math.max(0, (l.product.stock as number) - l.quantity) }).eq('id', l.product.id)
    }
    // Update customer aggregates
    if (customerId) {
      const { data: agg } = await supa.from('orders').select('total').eq('customer_id', customerId)
      const spent = (agg || []).reduce((s: number, o: any) => s + Number(o.total), 0)
      await supa.from('customers').update({ total_orders: (agg || []).length, total_spent: Math.round(spent * 100) / 100 }).eq('id', customerId)
    }

    // ---- Email notifications (recorded in email_notifications for retry) ----
    const { data: brand } = await supa.from('branding_settings').select('*').limit(1).maybeSingle()
    const storeName = brand?.store_name || 'JK Store'
    const notifyEmail = settings?.notify_email || process.env.NOTIFY_EMAIL || null
    const fmt = (n: number) => `Rs.${Number(n).toFixed(2)}`
    const itemsHtml = rows.map(r =>
      `<tr><td>${r.product_name}</td><td style="text-align:center">${r.quantity}</td><td style="text-align:right">${fmt(r.unit_price)}</td><td style="text-align:right">${fmt(r.line_total)}</td></tr>`).join('')
    const summaryHtml = `
      <p><b>Order ID:</b> ${orderNumber}</p>
      <p><b>Customer:</b> ${fullName} — ${phone}${email ? ` — ${email}` : ''}</p>
      <p><b>Address:</b> ${address}, ${city || ''}</p>
      <p><b>Source:</b> ${source} | <b>Payment:</b> Cash on Delivery</p>
      <table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><th>Product</th><th>Qty</th><th>Unit</th><th>Line</th></tr>${itemsHtml}
      </table>
      <p>Subtotal: ${fmt(subtotal)}<br/>Discount: -${fmt(discountTotal)}<br/>Delivery: ${fmt(delivery)}<br/><b>Total: ${fmt(total)}</b></p>`

    const notifRows: any[] = []
    if (notifyEmail) {
      try {
        const sent: any = await sendResendEmail(notifyEmail, `🛒 New Order ${orderNumber} — ${storeName}`, `<h2>New order received</h2>${summaryHtml}`)
        notifRows.push({ order_id: order.id, kind: 'admin_new_order', recipient: notifyEmail, status: 'sent', provider_id: sent?.id ?? null })
      } catch (e: any) {
        notifRows.push({ order_id: order.id, kind: 'admin_new_order', recipient: notifyEmail, status: 'failed', error: String(e?.message || e), attempts: 1, last_attempt: new Date().toISOString() })
      }
    }
    if (email) {
      try {
        const sent: any = await sendResendEmail(email, `Order Confirmed: ${orderNumber} — ${storeName}`,
          `<h2>Thank you, ${fullName}!</h2><p>Your order <b>${orderNumber}</b> has been received and is being processed. Track it anytime with your order ID and phone number.</p>${summaryHtml}`)
        notifRows.push({ order_id: order.id, kind: 'customer_confirmation', recipient: email, status: 'sent', provider_id: sent?.id ?? null })
      } catch (e: any) {
        notifRows.push({ order_id: order.id, kind: 'customer_confirmation', recipient: email, status: 'failed', error: String(e?.message || e), attempts: 1, last_attempt: new Date().toISOString() })
      }
    }
    if (notifRows.length) await supa.from('email_notifications').insert(notifRows)

    return json(res, 200, { ok: true, order_number: orderNumber, total, subtotal, discount_total: discountTotal, delivery_charge: delivery })
  } catch (e: any) {
    console.error('checkout error', e)
    return json(res, 400, { error: e?.message || 'Checkout failed' })
  }
}
