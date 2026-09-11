import type { Payload } from 'payload'
import { appendTimeline } from '@/fields/timeline'

type MarkPaidArgs = {
  payload: Payload
  orderNumber?: string
  orderId?: string | number
  reference?: string
  meta?: unknown
}

/**
 * Idempotently mark an order paid and decrement stock exactly once.
 * Safe to call multiple times from webhook retries.
 */
export const markOrderPaid = async ({
  payload,
  orderNumber,
  orderId,
  reference,
  meta,
}: MarkPaidArgs): Promise<{ updated: boolean; orderNumber?: string }> => {
  const order = orderId
    ? await payload.findByID({ collection: 'orders', id: orderId, depth: 0 }).catch(() => null)
    : (
        await payload.find({
          collection: 'orders',
          where: { orderNumber: { equals: orderNumber } },
          limit: 1,
          depth: 0,
        })
      ).docs[0]

  if (!order) {
    payload.logger.warn(`markOrderPaid: order not found (${orderNumber ?? orderId})`)
    return { updated: false }
  }

  if (order.paymentStatus === 'paid' && order.stockApplied) {
    return { updated: false, orderNumber: order.orderNumber ?? undefined }
  }

  // Decrement stock once.
  if (!order.stockApplied && Array.isArray(order.items)) {
    for (const item of order.items) {
      const productId = typeof item.product === 'object' ? item.product?.id : item.product
      if (!productId) continue
      const product = await payload
        .findByID({ collection: 'products', id: productId, depth: 0 })
        .catch(() => null)
      if (!product) continue
      const next = Math.max(0, (product.stockQty ?? 0) - (item.qty ?? 0))
      await payload.update({
        collection: 'products',
        id: productId,
        data: { stockQty: next },
        overrideAccess: true,
      })
    }
  }

  await payload.update({
    collection: 'orders',
    id: order.id,
    overrideAccess: true,
    data: {
      paymentStatus: 'paid',
      paidAt: new Date().toISOString(),
      paymentReference: reference ?? order.paymentReference,
      paymentMeta: meta ?? order.paymentMeta,
      stockApplied: true,
      timeline: appendTimeline(order.timeline, {
        event: 'Payment confirmed',
        note: reference ? `Ref ${reference}` : undefined,
        by: 'system',
      }),
    },
  })

  return { updated: true, orderNumber: order.orderNumber ?? undefined }
}
