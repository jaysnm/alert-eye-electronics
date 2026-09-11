import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'
import { markOrderPaid } from '@/lib/orders'

export const dynamic = 'force-dynamic'

/**
 * Safaricom Daraja STK callback. Safaricom does not sign callbacks, so we
 * (a) look the payment up by CheckoutRequestID we stored at init, and
 * (b) optionally restrict by source IP via MPESA_ALLOWED_IPS.
 */
export async function POST(req: Request) {
  const allowed = (process.env.MPESA_ALLOWED_IPS || '').split(',').map((s) => s.trim()).filter(Boolean)
  if (allowed.length) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (!ip || !allowed.includes(ip)) {
      return NextResponse.json({ ResultCode: 1, ResultDesc: 'Rejected' }, { status: 403 })
    }
  }

  const body = (await req.json()) as {
    Body?: {
      stkCallback?: {
        CheckoutRequestID: string
        ResultCode: number
        ResultDesc: string
        CallbackMetadata?: { Item: { Name: string; Value?: string | number }[] }
      }
    }
  }

  const cb = body.Body?.stkCallback
  if (!cb) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Ignored' })

  const payload = await getPayload()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { paymentReference: { equals: cb.CheckoutRequestID } },
    limit: 1,
    depth: 0,
  })
  const order = docs[0]

  if (order && cb.ResultCode === 0) {
    const receipt = cb.CallbackMetadata?.Item.find((i) => i.Name === 'MpesaReceiptNumber')?.Value
    await markOrderPaid({
      payload,
      orderId: order.id,
      reference: typeof receipt === 'string' ? receipt : cb.CheckoutRequestID,
      meta: cb,
    })
  } else if (order) {
    await payload.update({
      collection: 'orders',
      id: order.id,
      overrideAccess: true,
      data: { paymentStatus: 'failed', paymentMeta: cb },
    })
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' })
}
