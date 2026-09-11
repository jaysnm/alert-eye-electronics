import type { Metadata } from 'next'
import { CartView } from '@/components/cart/CartView'

export const metadata: Metadata = { title: 'Your cart' }

export default function CartPage() {
  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Your cart</h1>
      <CartView />
    </div>
  )
}
