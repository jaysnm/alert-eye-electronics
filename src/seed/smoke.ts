import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { markOrderPaid } from '../lib/orders'

const payload = await getPayload({ config })

const prod = (await payload.find({ collection: 'products', limit: 1, where: { stockQty: { greater_than: 5 } } })).docs[0]
const before = prod.stockQty
console.log(`product ${prod.title}: stock ${before}`)

const order = await payload.create({
  collection: 'orders',
  data: {
    contactName: 'Smoke Test',
    contactPhone: '+254712000000',
    contactEmail: 'smoke@test.local',
    items: [{ product: prod.id, title: prod.title, unitPriceKES: prod.priceKES, qty: 2 }],
    deliveryMethod: 'pickup',
    paymentMethod: 'manual_mpesa',
    paymentStatus: 'pending',
    fulfillmentStatus: 'processing',
  },
})
console.log(`order ${order.orderNumber} total=${order.totalKES} (expect ${prod.priceKES * 2})`)

const r1 = await markOrderPaid({ payload, orderNumber: order.orderNumber!, reference: 'TESTREF1' })
const r2 = await markOrderPaid({ payload, orderNumber: order.orderNumber!, reference: 'TESTREF1' })
console.log('markOrderPaid #1:', r1.updated, ' #2 (idempotent):', r2.updated)

const after = (await payload.findByID({ collection: 'products', id: prod.id })).stockQty
console.log(`stock after: ${after} (expect ${before - 2})`)

const paid = await payload.findByID({ collection: 'orders', id: order.id })
console.log(`payment status: ${paid.paymentStatus}, stockApplied: ${paid.stockApplied}`)

// cleanup
await payload.delete({ collection: 'orders', id: order.id })
await payload.update({ collection: 'products', id: prod.id, data: { stockQty: before } })
console.log('cleaned up')
process.exit(r1.updated && !r2.updated && after === before - 2 && paid.paymentStatus === 'paid' ? 0 : 1)
