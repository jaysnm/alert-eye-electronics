import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { verifyPaystackSignature } from '@/lib/payments/paystack'
import { markOrderPaid } from '@/lib/orders'
import { appendTimeline } from '@/fields/timeline'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const raw = await req.text()
  const signature = req.headers.get('x-paystack-signature')

  if (!(await verifyPaystackSignature(raw, signature))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(raw) as {
    event: string
    data: { reference: string; status: string; amount: number; metadata?: Record<string, unknown> }
  }

  if (event.event !== 'charge.success' || event.data.status !== 'success') {
    return NextResponse.json({ received: true })
  }

  const payload = await getPayload()
  const reference = event.data.reference

  // Deposit payments use a "DEP-" prefixed reference tied to a service request.
  if (reference.startsWith('DEP-')) {
    const requestNumber = reference.replace(/^DEP-/, '').split('-').slice(0, 3).join('-')
    const { docs } = await payload.find({
      collection: 'service-requests',
      where: { requestNumber: { equals: requestNumber } },
      limit: 1,
      depth: 0,
    })
    const sr = docs[0]
    if (sr && !sr.quote?.depositPaid) {
      await payload.update({
        collection: 'service-requests',
        id: sr.id,
        overrideAccess: true,
        data: {
          quote: { ...sr.quote, depositPaid: true, depositReference: reference },
          timeline: appendTimeline(sr.timeline, { event: 'Deposit paid', note: `Ref ${reference}`, by: 'system' }),
        },
      })
    }
    return NextResponse.json({ received: true })
  }

  await markOrderPaid({ payload, orderNumber: reference, reference, meta: event.data })
  return NextResponse.json({ received: true })
}
