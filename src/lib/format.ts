// Price / discount helpers shared by storefront and admin.
import type { Product, StoreSettings } from './types'

export function formatMoney(n: number | null | undefined, symbol = 'Rs.'): string {
  const v = Number(n ?? 0)
  return `${symbol}${v.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export interface Priced {
  unit: number          // final selling unit price
  original: number      // MRP (crossed out)
  discountPerUnit: number
  discountPercent: number | null  // badge %
  onSale: boolean
}

export function priceOf(p: Product, _settings?: StoreSettings | null): Priced {
  const original = Number(p.original_price) || 0
  let unit = p.selling_price != null && Number(p.selling_price) > 0 ? Number(p.selling_price) : original
  let discountPerUnit = Math.max(0, original - unit)
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
        unit = discounted
        discountPerUnit = original - discounted
      }
    }
  }
  const pct = original > 0 && discountPerUnit > 0
    ? Math.round((discountPerUnit / original) * 100)
    : null
  return { unit, original, discountPerUnit, discountPercent: pct, onSale: discountPerUnit > 0 }
}

export function waLink(number: string, message: string): string {
  const n = number.replace(/[^+\d]/g, '')
  return `https://wa.me/${n.replace(/^\+/, '')}?text=${encodeURIComponent(message)}`
}

export function telLink(number: string): string {
  return `tel:${number.replace(/\s+/g, '')}`
}
