import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from './types'
import { priceOf } from './format'

export interface CartItem { product: Product; quantity: number }

interface CartState {
  items: CartItem[]
  add: (p: Product, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
  count: number
  subtotal: number
  discount: number
}

const CartCtx = createContext<CartState>({} as CartState)
export const useCart = () => useContext(CartCtx)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('jk-cart') || '[]') } catch { return [] } }
  )
  useEffect(() => { localStorage.setItem('jk-cart', JSON.stringify(items)) }, [items])

  const add = (p: Product, qty = 1) =>
    setItems(prev => {
      const found = prev.find(i => i.product.id === p.id)
      if (found) return prev.map(i => i.product.id === p.id ? { ...i, quantity: Math.min(99, i.quantity + qty) } : i)
      return [...prev, { product: p, quantity: Math.min(99, qty) }]
    })
  const remove = (id: string) => setItems(prev => prev.filter(i => i.product.id !== id))
  const setQty = (id: string, qty: number) =>
    setItems(prev => qty <= 0 ? prev.filter(i => i.product.id !== id)
      : prev.map(i => i.product.id === id ? { ...i, quantity: Math.min(99, qty) } : i))
  const clear = () => setItems([])

  const { count, subtotal, discount } = useMemo(() => {
    let c = 0, s = 0, d = 0
    for (const i of items) {
      const pr = priceOf(i.product)
      c += i.quantity; s += pr.unit * i.quantity; d += pr.discountPerUnit * i.quantity
    }
    return { count: c, subtotal: s, discount: d }
  }, [items])

  return <CartCtx.Provider value={{ items, add, remove, setQty, clear, count, subtotal, discount }}>{children}</CartCtx.Provider>
}
