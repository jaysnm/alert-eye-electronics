import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Clock, Circle } from 'lucide-react'
import { getPayload } from '@/lib/payload'
import { formatKES } from '@/lib/format'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Order status' }

const FULFILLMENT_STEPS = ['processing', 'packed', 'dispatched', 'delivered'] as const
const PAYMENT_LABEL: Record<string, string> = {
  pending: 'Awaiting payment',
  paid: 'Paid',
  failed: 'Payment failed',
  refunded: 'Refunded',
}

export default async function OrderStatusPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { orderNumber: { equals: orderNumber } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const order = docs[0]
  if (!order) notFound()

  const currentStep = FULFILLMENT_STEPS.indexOf(order.fulfillmentStatus as never)
  const cancelled = order.fulfillmentStatus === 'cancelled'

  return (
    <div className="container-page py-10 max-w-2xl">
      <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-sm text-slate-500">Order</p>
        <h1 className="text-2xl font-bold text-navy-900">{order.orderNumber}</h1>

        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span
            className={`rounded-full px-3 py-1 font-medium ${
              order.paymentStatus === 'paid'
                ? 'bg-green-100 text-green-700'
                : order.paymentStatus === 'failed'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
            }`}
          >
            {PAYMENT_LABEL[order.paymentStatus ?? 'pending']}
          </span>
          <span className="rounded-full px-3 py-1 bg-slate-100 text-slate-600 capitalize">
            {order.fulfillmentStatus}
          </span>
        </div>

        {order.paymentStatus === 'pending' && order.paymentMethod === 'manual_mpesa' && (
          <p className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Pay via M-Pesa Paybill <strong>{process.env.NEXT_PUBLIC_MPESA_PAYBILL}</strong>, account{' '}
            <strong>{order.orderNumber}</strong>, amount <strong>{formatKES(order.totalKES ?? 0)}</strong>. We
            confirm and dispatch once payment reflects.
          </p>
        )}

        {!cancelled && (
          <ol className="mt-8 space-y-3">
            {FULFILLMENT_STEPS.map((step, i) => {
              const state = i < currentStep ? 'done' : i === currentStep ? 'current' : 'todo'
              return (
                <li key={step} className="flex items-center gap-3">
                  {state === 'done' ? (
                    <CheckCircle2 size={20} className="text-green-600" />
                  ) : state === 'current' ? (
                    <Clock size={20} className="text-navy-700" />
                  ) : (
                    <Circle size={20} className="text-slate-300" />
                  )}
                  <span className={`capitalize text-sm ${state === 'todo' ? 'text-slate-400' : 'text-slate-800 font-medium'}`}>
                    {step}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
        {cancelled && <p className="mt-6 text-red-600 font-medium">This order was cancelled.</p>}

        <div className="mt-8 border-t border-slate-100 pt-4">
          <h2 className="font-semibold text-navy-900 mb-2">Items</h2>
          <ul className="text-sm space-y-1">
            {(order.items ?? []).map((it, idx) => (
              <li key={idx} className="flex justify-between">
                <span>{it.qty} × {it.title}</span>
                <span>{formatKES(it.unitPriceKES * it.qty)}</span>
              </li>
            ))}
            <li className="flex justify-between text-slate-500 pt-1">
              <span>Delivery</span>
              <span>{formatKES(order.deliveryFeeKES ?? 0)}</span>
            </li>
            <li className="flex justify-between font-bold text-navy-900 pt-1">
              <span>Total</span>
              <span>{formatKES(order.totalKES ?? 0)}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center mt-6">
        <Link href="/shop" className="text-sm font-semibold text-navy-500 hover:underline">
          Continue shopping →
        </Link>
      </div>
    </div>
  )
}
