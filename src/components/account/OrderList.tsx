import Link from 'next/link'
import type { Order } from '@/payload-types'
import { formatKES } from '@/lib/format'

export const OrderList = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) return <p className="text-sm text-slate-500">No orders yet.</p>
  return (
    <div className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
      {orders.map((o) => (
        <Link key={o.id} href={`/order/${o.orderNumber}`} className="flex items-center justify-between gap-4 p-4 hover:bg-slate-50">
          <div>
            <p className="font-semibold text-navy-900">{o.orderNumber}</p>
            <p className="text-xs text-slate-500">
              {new Date(o.createdAt).toLocaleDateString('en-KE')} · {(o.items ?? []).length} item(s)
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatKES(o.totalKES ?? 0)}</p>
            <p className="text-xs capitalize text-slate-500">
              {o.paymentStatus} · {o.fulfillmentStatus}
            </p>
          </div>
        </Link>
      ))}
    </div>
  )
}
