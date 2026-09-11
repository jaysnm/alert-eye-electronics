import type { Metadata } from 'next'
import { getPayload } from '@/lib/payload'
import { getSessionCustomer } from '@/actions/auth'
import { AuthPanel } from '@/components/account/AuthPanel'
import { AccountHeader } from '@/components/account/AccountHeader'
import { OrderList } from '@/components/account/OrderList'
import { ServiceRequestList } from '@/components/account/ServiceRequestList'

export const metadata: Metadata = { title: 'My account' }
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const customer = await getSessionCustomer()

  if (!customer) {
    return (
      <div className="container-page py-10">
        <h1 className="text-2xl font-bold text-navy-900 mb-6 text-center">My account</h1>
        <AuthPanel />
      </div>
    )
  }

  const payload = await getPayload()
  const [orders, requests] = await Promise.all([
    payload.find({
      collection: 'orders',
      where: { customer: { equals: customer.id } },
      sort: '-createdAt',
      limit: 25,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'service-requests',
      where: { customer: { equals: customer.id } },
      sort: '-createdAt',
      limit: 25,
      depth: 1,
      overrideAccess: true,
    }),
  ])

  return (
    <div className="container-page py-8 space-y-10">
      <AccountHeader name={customer.name} email={customer.email} />

      <section>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Service requests</h2>
        <ServiceRequestList requests={requests.docs} />
      </section>

      <section>
        <h2 className="text-lg font-bold text-navy-900 mb-4">Orders</h2>
        <OrderList orders={orders.docs} />
      </section>
    </div>
  )
}
