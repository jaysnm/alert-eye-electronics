'use server'

import { z } from 'zod'
import { getPayload } from '@/lib/payload'
import { getCurrentCustomer } from '@/lib/auth'
import { getPaymentProvider, type PaymentMethod } from '@/lib/payments'
import { normalizeKePhone } from '@/lib/format'

const DELIVERY_FEES: Record<string, number> = {
  pickup: 0,
  nairobi: Number(process.env.DELIVERY_FEE_NAIROBI ?? 300),
  countrywide: Number(process.env.DELIVERY_FEE_COUNTRYWIDE ?? 650),
}

const schema = z.object({
  items: z
    .array(z.object({ productId: z.union([z.string(), z.number()]), qty: z.number().int().min(1).max(50) }))
    .min(1),
  contact: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(7).max(20),
    email: z.string().email().optional().or(z.literal('')),
  }),
  deliveryMethod: z.enum(['pickup', 'nairobi', 'countrywide']),
  address: z
    .object({
      recipient: z.string().optional(),
      phone: z.string().optional(),
      town: z.string().optional(),
      area: z.string().optional(),
      details: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(['paystack', 'mpesa_stk', 'manual_mpesa', 'bank_transfer', 'cash_on_delivery']),
})

export type CheckoutInput = z.infer<typeof schema>

export type CheckoutResult =
  | { ok: false; error: string }
  | {
      ok: true
      orderNumber: string
      payment:
        | { mode: 'redirect'; url: string }
        | { mode: 'stk_push'; message: string }
        | { mode: 'manual'; instructions: string }
    }

export async function submitCheckout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Please check the form and try again.' }
  const data = parsed.data

  const phone = normalizeKePhone(data.contact.phone)
  if (!phone) return { ok: false, error: 'Enter a valid Kenyan phone number.' }

  if (data.deliveryMethod !== 'pickup') {
    if (!data.address?.town || !data.address?.details) {
      return { ok: false, error: 'A delivery address is required for this delivery method.' }
    }
  }

  const payload = await getPayload()
  const customer = await getCurrentCustomer()

  // Server-authoritative pricing + stock check.
  const lineItems: {
    product: number
    title: string
    sku?: string
    unitPriceKES: number
    qty: number
  }[] = []

  for (const line of data.items) {
    const product = await payload
      .findByID({ collection: 'products', id: line.productId, depth: 0 })
      .catch(() => null)
    if (!product || product.status !== 'active') {
      return { ok: false, error: `An item in your cart is no longer available.` }
    }
    if ((product.stockQty ?? 0) < line.qty) {
      return { ok: false, error: `"${product.title}" only has ${product.stockQty ?? 0} left in stock.` }
    }
    lineItems.push({
      product: product.id,
      title: product.title,
      sku: product.sku ?? undefined,
      unitPriceKES: product.priceKES,
      qty: line.qty,
    })
  }

  const deliveryFeeKES = DELIVERY_FEES[data.deliveryMethod] ?? 0

  const order = await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: {
      customer: customer?.id,
      contactName: data.contact.name,
      contactPhone: phone,
      contactEmail: data.contact.email || undefined,
      items: lineItems,
      deliveryMethod: data.deliveryMethod,
      deliveryFeeKES,
      shippingAddress: data.deliveryMethod === 'pickup' ? undefined : data.address,
      paymentMethod: data.paymentMethod,
      paymentStatus: 'pending',
      fulfillmentStatus: 'processing',
    },
  })

  const amountKES = order.totalKES ?? 0
  const orderNumber = order.orderNumber as string
  const provider = getPaymentProvider(data.paymentMethod as PaymentMethod)
  const origin = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

  try {
    const result = await provider.init({
      reference: orderNumber,
      amountKES,
      email: data.contact.email || undefined,
      phone,
      description: `Order ${orderNumber}`,
      callbackUrl: `${origin}/order/${orderNumber}`,
    })

    if (result.mode === 'stk_push') {
      await payload.update({
        collection: 'orders',
        id: order.id,
        overrideAccess: true,
        data: { paymentReference: result.providerRef },
      })
    }

    return { ok: true, orderNumber, payment: result }
  } catch (err) {
    payload.logger.error({ err, msg: 'Payment init failed' })
    return {
      ok: true,
      orderNumber,
      payment: {
        mode: 'manual',
        instructions:
          'We could not start the online payment automatically. Our team will contact you shortly with payment details, or you can pay on delivery.',
      },
    }
  }
}
