import type { PaymentProvider, InitPaymentArgs, InitPaymentResult, VerifyResult } from './types'

const BASE = 'https://api.paystack.co'

export const paystackProvider: PaymentProvider = {
  method: 'paystack',
  get configured() {
    return Boolean(process.env.PAYSTACK_SECRET_KEY)
  },

  async init(args: InitPaymentArgs): Promise<InitPaymentResult> {
    if (!this.configured) {
      throw new Error('Paystack is not configured (missing PAYSTACK_SECRET_KEY).')
    }
    const res = await fetch(`${BASE}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reference: args.reference,
        amount: Math.round(args.amountKES * 100), // subunits
        currency: 'KES',
        email: args.email || `${args.reference}@guest.alerteye.co.ke`,
        callback_url: args.callbackUrl,
        metadata: { description: args.description, phone: args.phone },
      }),
    })
    const json = (await res.json()) as {
      status: boolean
      message: string
      data?: { authorization_url: string; reference: string }
    }
    if (!json.status || !json.data) throw new Error(`Paystack init failed: ${json.message}`)
    return { mode: 'redirect', url: json.data.authorization_url, providerRef: json.data.reference }
  },

  async verify(reference: string): Promise<VerifyResult> {
    const res = await fetch(`${BASE}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
    })
    const json = (await res.json()) as {
      status: boolean
      data?: { status: string; amount: number }
    }
    const paid = json.status && json.data?.status === 'success'
    return { paid: Boolean(paid), amountKES: json.data ? json.data.amount / 100 : undefined, raw: json }
  },
}

/** Verify the signature on a Paystack webhook payload. */
export const verifyPaystackSignature = async (rawBody: string, signature: string | null): Promise<boolean> => {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false
  const { createHmac } = await import('crypto')
  const hash = createHmac('sha512', process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest('hex')
  return hash === signature
}
