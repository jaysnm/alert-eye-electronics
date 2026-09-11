'use server'

import { getPayload } from '@/lib/payload'
import { getSessionCustomer } from '@/actions/auth'
import { getPaymentProvider } from '@/lib/payments'
import { appendTimeline } from '@/fields/timeline'

type Result =
  | { ok: false; error: string }
  | { ok: true; paid: boolean; redirectUrl?: string }

export async function acceptQuote(requestNumber: string, payDeposit: boolean): Promise<Result> {
  const customer = await getSessionCustomer()
  if (!customer) return { ok: false, error: 'Please sign in to accept a quote.' }

  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'service-requests',
    where: {
      and: [{ requestNumber: { equals: requestNumber } }, { customer: { equals: customer.id } }],
    },
    limit: 1,
    depth: 0,
  })
  const sr = docs[0]
  if (!sr) return { ok: false, error: 'Request not found.' }
  if (sr.status !== 'quoted') return { ok: false, error: 'This quote is no longer open.' }

  await payload.update({
    collection: 'service-requests',
    id: sr.id,
    overrideAccess: true,
    data: {
      quote: { ...sr.quote, acceptedAt: new Date().toISOString() },
      timeline: appendTimeline(sr.timeline, { event: 'Quote accepted by customer', by: 'customer' }),
    },
  })

  const deposit = sr.quote?.depositKES ?? 0
  if (payDeposit && deposit > 0) {
    const provider = getPaymentProvider('paystack')
    if (provider.configured) {
      const origin = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
      const result = await provider.init({
        reference: `DEP-${sr.requestNumber}-${Date.now().toString(36)}`,
        amountKES: deposit,
        email: sr.contactEmail ?? customer.email,
        phone: sr.contactPhone,
        description: `Deposit for ${sr.requestNumber}`,
        callbackUrl: `${origin}/account`,
      })
      if (result.mode === 'redirect') return { ok: true, paid: false, redirectUrl: result.url }
    }
    return { ok: true, paid: false }
  }

  return { ok: true, paid: false }
}
