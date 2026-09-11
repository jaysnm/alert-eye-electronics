import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout/CheckoutForm'
import { availablePaymentMethods } from '@/lib/payments'
import { getCurrentCustomer } from '@/lib/auth'

export const metadata: Metadata = { title: 'Checkout' }
export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer()
  const methods = availablePaymentMethods()

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Checkout</h1>
      <CheckoutForm
        paymentMethods={methods}
        defaults={{
          name: customer?.name ?? '',
          phone: customer?.phone ?? '',
          email: customer?.email ?? '',
        }}
      />
    </div>
  )
}
