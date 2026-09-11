'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart'
import { formatKES } from '@/lib/format'
import { submitCheckout, type CheckoutInput } from '@/actions/checkout'
import { CartView } from '@/components/cart/CartView'

const DELIVERY = [
  { value: 'pickup', label: 'Pickup — Nairobi CBD shop', fee: 0 },
  { value: 'nairobi', label: 'Delivery — within Nairobi', fee: 300 },
  { value: 'countrywide', label: 'Delivery — countrywide courier', fee: 650 },
] as const

type Method = { value: string; label: string }

export const CheckoutForm = ({
  paymentMethods,
  defaults,
}: {
  paymentMethods: Method[]
  defaults: { name: string; phone: string; email: string }
}) => {
  const { items, subtotal, clear } = useCart()
  const [form, setForm] = useState({
    name: defaults.name,
    phone: defaults.phone,
    email: defaults.email,
    deliveryMethod: 'pickup' as CheckoutInput['deliveryMethod'],
    town: '',
    area: '',
    details: '',
    paymentMethod: (paymentMethods[0]?.value ?? 'manual_mpesa') as string,
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<
    | null
    | { orderNumber: string; mode: 'stk_push' | 'manual'; message: string }
  >(null)

  const delivery = DELIVERY.find((d) => d.value === form.deliveryMethod)!
  const total = subtotal() + delivery.fee

  if (items.length === 0 && !done) {
    return (
      <div className="text-center py-16">
        <p className="text-slate-500">Your cart is empty.</p>
        <Link href="/shop" className="mt-4 inline-block rounded-lg bg-navy-900 text-white font-semibold px-5 py-2.5">
          Go to shop
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center rounded-xl border border-slate-200 bg-white p-8">
        <h2 className="text-xl font-bold text-navy-900">Order {done.orderNumber} placed</h2>
        <p className="mt-3 text-slate-600 whitespace-pre-line">{done.message}</p>
        <Link
          href={`/order/${done.orderNumber}`}
          className="mt-6 inline-block rounded-lg bg-navy-900 text-white font-semibold px-5 py-2.5"
        >
          View order status
        </Link>
      </div>
    )
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await submitCheckout({
      items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      contact: { name: form.name, phone: form.phone, email: form.email || undefined },
      deliveryMethod: form.deliveryMethod,
      address:
        form.deliveryMethod === 'pickup'
          ? undefined
          : { recipient: form.name, phone: form.phone, town: form.town, area: form.area, details: form.details },
      paymentMethod: form.paymentMethod as CheckoutInput['paymentMethod'],
    })
    setBusy(false)

    if (!res.ok) {
      setError(res.error)
      return
    }
    if (res.payment.mode === 'redirect') {
      clear()
      window.location.href = res.payment.url
      return
    }
    clear()
    setDone({
      orderNumber: res.orderNumber,
      mode: res.payment.mode,
      message: res.payment.mode === 'stk_push' ? res.payment.message : res.payment.instructions,
    })
  }

  const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-500'

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div className="space-y-8">
        <section>
          <h2 className="font-semibold text-navy-900 mb-3">Contact details</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <input required placeholder="Full name" className={input} value={form.name} onChange={(e) => set('name', e.target.value)} />
            <input required placeholder="Phone (0712…)" className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            <input type="email" placeholder="Email (for receipt)" className={`${input} sm:col-span-2`} value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
        </section>

        <section>
          <h2 className="font-semibold text-navy-900 mb-3">Delivery</h2>
          <div className="space-y-2">
            {DELIVERY.map((d) => (
              <label key={d.value} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="delivery"
                  checked={form.deliveryMethod === d.value}
                  onChange={() => set('deliveryMethod', d.value)}
                />
                <span className="flex-1">{d.label}</span>
                <span className="font-semibold">{d.fee ? formatKES(d.fee) : 'Free'}</span>
              </label>
            ))}
          </div>
          {form.deliveryMethod !== 'pickup' && (
            <div className="grid sm:grid-cols-2 gap-3 mt-3">
              <input required placeholder="Town / city" className={input} value={form.town} onChange={(e) => set('town', e.target.value)} />
              <input placeholder="Estate / area" className={input} value={form.area} onChange={(e) => set('area', e.target.value)} />
              <textarea required placeholder="Street, building, directions" className={`${input} sm:col-span-2`} value={form.details} onChange={(e) => set('details', e.target.value)} />
            </div>
          )}
        </section>

        <section>
          <h2 className="font-semibold text-navy-900 mb-3">Payment</h2>
          <div className="space-y-2">
            {paymentMethods.map((m) => (
              <label key={m.value} className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === m.value}
                  onChange={() => set('paymentMethod', m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
        </section>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit space-y-4">
        <h2 className="font-semibold text-navy-900">Order summary</h2>
        <div className="max-h-64 overflow-auto -mx-1 px-1">
          <CartView compact />
        </div>
        <div className="border-t border-slate-100 pt-3 text-sm space-y-1">
          <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatKES(subtotal())}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span>{delivery.fee ? formatKES(delivery.fee) : 'Free'}</span></div>
          <div className="flex justify-between font-bold text-navy-900 text-base pt-1"><span>Total</span><span>{formatKES(total)}</span></div>
        </div>
        <button
          disabled={busy}
          className="w-full rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold px-5 py-3 disabled:opacity-60"
        >
          {busy ? 'Placing order…' : `Place order · ${formatKES(total)}`}
        </button>
      </div>
    </form>
  )
}
