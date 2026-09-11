'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useCart, type CartItem } from '@/lib/cart'
import { cn } from '@/lib/utils'

type Props = {
  item: Omit<CartItem, 'qty'>
  className?: string
  label?: string
  withQty?: boolean
}

export const AddToCartButton = ({ item, className, label = 'Add to cart', withQty = false }: Props) => {
  const add = useCart((s) => s.add)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const soldOut = item.maxQty <= 0

  const handleAdd = () => {
    add(item, qty)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {withQty && !soldOut && (
        <div className="flex items-center rounded-lg border border-slate-300">
          <button className="px-3 py-2 text-lg" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
            −
          </button>
          <span className="w-8 text-center text-sm">{qty}</span>
          <button
            className="px-3 py-2 text-lg"
            onClick={() => setQty((q) => Math.min(item.maxQty, q + 1))}
            aria-label="Increase"
          >
            +
          </button>
        </div>
      )}
      <button
        disabled={soldOut}
        onClick={handleAdd}
        className={cn(
          'flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 font-semibold text-sm transition-colors',
          soldOut
            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
            : 'bg-navy-900 text-white hover:bg-navy-700',
        )}
      >
        {soldOut ? (
          'Out of stock'
        ) : added ? (
          <>
            <Check size={16} /> Added
          </>
        ) : (
          <>
            <ShoppingCart size={16} /> {label}
          </>
        )}
      </button>
    </div>
  )
}
