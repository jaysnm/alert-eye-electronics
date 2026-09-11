'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  productId: string | number
  slug: string
  title: string
  priceKES: number
  image?: string | null
  qty: number
  maxQty: number
}

type CartState = {
  items: CartItem[]
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (productId: string | number, qty: number) => void
  remove: (productId: string | number) => void
  clear: () => void
  count: () => number
  subtotal: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, qty: Math.min(i.qty + qty, i.maxQty) }
                  : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, qty: Math.min(qty, item.maxQty) }] }
        }),
      setQty: (productId, qty) =>
        set((state) => ({
          items: state.items
            .map((i) => (i.productId === productId ? { ...i, qty: Math.max(0, Math.min(qty, i.maxQty)) } : i))
            .filter((i) => i.qty > 0),
        })),
      remove: (productId) =>
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => get().items.reduce((n, i) => n + i.qty * i.priceKES, 0),
    }),
    { name: 'alert-eye-cart' },
  ),
)
