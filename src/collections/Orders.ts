import type { CollectionConfig } from 'payload'
import { isStaff, ownerOrStaff } from '@/access'
import { timelineField, appendTimeline } from '@/fields/timeline'
import { orderNumber } from '@/lib/refnum'
import { sendEmail, staffInbox } from '@/lib/email'
import { formatKES } from '@/lib/format'

export const DELIVERY_METHODS = [
  { label: 'Pickup — Nairobi CBD shop', value: 'pickup' },
  { label: 'Delivery — within Nairobi', value: 'nairobi' },
  { label: 'Delivery — countrywide (courier)', value: 'countrywide' },
] as const

export const PAYMENT_METHODS = [
  { label: 'Paystack (card / M-Pesa)', value: 'paystack' },
  { label: 'M-Pesa STK push', value: 'mpesa_stk' },
  { label: 'M-Pesa Paybill (manual confirmation)', value: 'manual_mpesa' },
  { label: 'Bank transfer', value: 'bank_transfer' },
  { label: 'Pay on delivery / pickup', value: 'cash_on_delivery' },
] as const

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: ['orderNumber', 'contactName', 'totalKES', 'paymentStatus', 'fulfillmentStatus', 'createdAt'],
    group: 'Sales',
    listSearchableFields: ['orderNumber', 'contactName', 'contactPhone', 'contactEmail'],
  },
  access: {
    read: ownerOrStaff('customer'),
    create: isStaff, // storefront orders are created via a server action with overrideAccess
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    {
      name: 'orderNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: { readOnly: true, position: 'sidebar' },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      admin: { position: 'sidebar', description: 'Linked account (blank for guest checkout).' },
    },
    {
      type: 'collapsible',
      label: 'Customer contact',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'contactName', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'contactPhone', type: 'text', required: true, admin: { width: '50%' } },
          ],
        },
        { name: 'contactEmail', type: 'email' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'Snapshot of what was ordered — prices are frozen at checkout time.' },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'products' },
        {
          type: 'row',
          fields: [
            { name: 'title', type: 'text', required: true, admin: { width: '45%' } },
            { name: 'sku', type: 'text', admin: { width: '20%' } },
            { name: 'unitPriceKES', type: 'number', required: true, admin: { width: '17%' } },
            { name: 'qty', type: 'number', required: true, min: 1, admin: { width: '18%' } },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'deliveryMethod',
          type: 'select',
          required: true,
          defaultValue: 'pickup',
          options: [...DELIVERY_METHODS],
          admin: { width: '60%' },
        },
        { name: 'deliveryFeeKES', type: 'number', defaultValue: 0, admin: { width: '40%' } },
      ],
    },
    {
      name: 'shippingAddress',
      type: 'group',
      admin: { condition: (data) => data?.deliveryMethod !== 'pickup' },
      fields: [
        { name: 'recipient', type: 'text' },
        { name: 'phone', type: 'text' },
        { name: 'town', type: 'text' },
        { name: 'area', type: 'text' },
        { name: 'details', type: 'textarea' },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'subtotalKES', type: 'number', admin: { readOnly: true, width: '50%' } },
        { name: 'totalKES', type: 'number', admin: { readOnly: true, width: '50%' } },
      ],
    },
    // Payment
    {
      type: 'collapsible',
      label: 'Payment',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'paymentMethod',
              type: 'select',
              required: true,
              defaultValue: 'paystack',
              options: [...PAYMENT_METHODS],
              admin: { width: '50%' },
            },
            {
              name: 'paymentStatus',
              type: 'select',
              required: true,
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Paid', value: 'paid' },
                { label: 'Failed', value: 'failed' },
                { label: 'Refunded', value: 'refunded' },
              ],
              admin: { width: '50%' },
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'paymentReference', type: 'text', admin: { width: '50%', description: 'Provider transaction reference.' } },
            { name: 'paidAt', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
          ],
        },
        { name: 'stockApplied', type: 'checkbox', admin: { readOnly: true, description: 'Set once stock has been decremented for this order.' } },
        { name: 'paymentMeta', type: 'json', admin: { readOnly: true } },
      ],
    },
    {
      name: 'fulfillmentStatus',
      type: 'select',
      required: true,
      defaultValue: 'processing',
      options: [
        { label: 'Processing', value: 'processing' },
        { label: 'Packed', value: 'packed' },
        { label: 'Dispatched', value: 'dispatched' },
        { label: 'Delivered / collected', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      admin: { position: 'sidebar' },
    },
    { name: 'notes', type: 'textarea', admin: { position: 'sidebar', description: 'Internal notes.' } },
    timelineField,
  ],
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        if (operation === 'create' && !data.orderNumber) data.orderNumber = orderNumber()

        if (Array.isArray(data.items)) {
          const subtotal = data.items.reduce(
            (sum: number, it: { unitPriceKES?: number; qty?: number }) =>
              sum + (it.unitPriceKES ?? 0) * (it.qty ?? 0),
            0,
          )
          data.subtotalKES = subtotal
          data.totalKES = subtotal + (data.deliveryFeeKES ?? 0)
        }

        if (operation === 'create' && (!data.timeline || data.timeline.length === 0)) {
          data.timeline = appendTimeline([], { event: 'Order placed', by: 'system' })
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const { payload } = req
        const isNew = operation === 'create'
        const paymentJustPaid =
          doc.paymentStatus === 'paid' && (isNew || previousDoc?.paymentStatus !== 'paid')
        const fulfillmentChanged = !isNew && previousDoc?.fulfillmentStatus !== doc.fulfillmentStatus

        const itemLines = (doc.items ?? [])
          .map((it: { title: string; qty: number; unitPriceKES: number }) =>
            `<tr><td style="padding:4px 0">${it.qty} × ${it.title}</td><td style="text-align:right">${formatKES(it.unitPriceKES * it.qty)}</td></tr>`,
          )
          .join('')
        const summary = `
          <table style="width:100%;border-collapse:collapse;margin:12px 0">${itemLines}
            <tr><td style="padding-top:8px">Delivery</td><td style="text-align:right;padding-top:8px">${formatKES(doc.deliveryFeeKES)}</td></tr>
            <tr><td style="font-weight:700;padding-top:8px">Total</td><td style="text-align:right;font-weight:700;padding-top:8px">${formatKES(doc.totalKES)}</td></tr>
          </table>`

        if (isNew) {
          await sendEmail({
            payload,
            to: staffInbox(),
            subject: `New order ${doc.orderNumber} — ${formatKES(doc.totalKES)}`,
            title: `New order ${doc.orderNumber}`,
            bodyHtml: `<p>${doc.contactName} · ${doc.contactPhone}</p>${summary}<p>Payment: ${doc.paymentMethod} (${doc.paymentStatus})</p>`,
          })
          if (doc.contactEmail) {
            await sendEmail({
              payload,
              to: doc.contactEmail,
              subject: `We received your order ${doc.orderNumber}`,
              title: `Thank you for your order`,
              bodyHtml: `<p>Hi ${doc.contactName}, we've received order <strong>${doc.orderNumber}</strong>.</p>${summary}<p>We'll be in touch shortly.</p>`,
            })
          }
        }

        if (paymentJustPaid && !isNew && doc.contactEmail) {
          await sendEmail({
            payload,
            to: doc.contactEmail,
            subject: `Payment received for ${doc.orderNumber}`,
            title: `Payment confirmed`,
            bodyHtml: `<p>We've received your payment of ${formatKES(doc.totalKES)} for order ${doc.orderNumber}. It's now being prepared.</p>`,
          })
        }

        if (fulfillmentChanged && doc.contactEmail) {
          await sendEmail({
            payload,
            to: doc.contactEmail,
            subject: `Order ${doc.orderNumber} — ${doc.fulfillmentStatus}`,
            title: `Order update`,
            bodyHtml: `<p>Your order ${doc.orderNumber} is now <strong>${doc.fulfillmentStatus}</strong>.</p>`,
          })
        }
      },
    ],
  },
}
