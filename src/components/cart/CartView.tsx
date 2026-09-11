'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Trash2 } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { formatKES } from '@/lib/format'

export const CartView = ({ compact = false }: { compact?: boolean }) => {
  const { items, setQty, remove, subtotal } = useCart()

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block rounded-lg bg-navy-900 text-white font-semibold px-5 py-2.5">
          Start shopping
        </Link>
      </div>
    )
  }

  return (
    <div className={compact ? '' : 'grid lg:grid-cols-[1fr_320px] gap-8'}>
      <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
        {items.map((item) => (
          <li key={item.productId} className="flex gap-3 p-3 sm:p-4">
            <div className="relative h-20 w-20 shrink-0 rounded-lg border border-slate-100 bg-white">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="80px" className="object-contain p-1" />
              ) : (
                <div className="h-full w-full grid place-items-center text-[10px] text-slate-300">No image</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.slug}`} className="text-sm font-medium text-slate-800 line-clamp-2">
                {item.title}
              </Link>
              <p className="text-sm text-navy-900 font-semibold mt-1">{formatKES(item.priceKES)}</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex items-center rounded-lg border border-slate-300">
                  <button className="px-2.5 py-1" onClick={() => setQty(item.productId, item.qty - 1)}>−</button>
                  <span className="w-8 text-center text-sm">{item.qty}</span>
                  <button
                    className="px-2.5 py-1"
                    onClick={() => setQty(item.productId, item.qty + 1)}
                    disabled={item.qty >= item.maxQty}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => remove(item.productId)}
                  className="text-slate-400 hover:text-red-600"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
                <span className="ml-auto text-sm font-semibold text-slate-700">
                  {formatKES(item.priceKES * item.qty)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {!compact && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-500">Subtotal</span>
            <span className="font-semibold">{formatKES(subtotal())}</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">Delivery calculated at checkout.</p>
          <Link
            href="/checkout"
            className="block text-center rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold px-5 py-3"
          >
            Proceed to checkout
          </Link>
          <Link href="/shop" className="block text-center text-sm text-navy-500 mt-3 hover:underline">
            Continue shopping
          </Link>
        </div>
      )}
    </div>
  )
}
