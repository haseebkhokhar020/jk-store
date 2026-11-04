// Remember placed orders on this device so the customer never loses the ID.
export interface SavedOrder { order_number: string; phone: string; total: number; at: string }

const KEY = 'jk-my-orders'

export function getSavedOrders(): SavedOrder[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveOrder(o: SavedOrder) {
  const list = getSavedOrders().filter(x => x.order_number !== o.order_number)
  list.unshift(o)
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20)))
}
