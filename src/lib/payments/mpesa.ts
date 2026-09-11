import type { PaymentProvider, InitPaymentArgs, InitPaymentResult, VerifyResult } from './types'
import { normalizeKePhone } from '@/lib/format'

const hosts = {
  sandbox: 'https://sandbox.safaricom.co.ke',
  production: 'https://api.safaricom.co.ke',
}

const host = () => hosts[(process.env.MPESA_ENV as 'sandbox' | 'production') || 'sandbox']

const getToken = async (): Promise<string> => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`,
  ).toString('base64')
  const res = await fetch(`${host()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
    cache: 'no-store',
  })
  const json = (await res.json()) as { access_token?: string; errorMessage?: string }
  if (!json.access_token) throw new Error(`M-Pesa auth failed: ${json.errorMessage ?? 'unknown'}`)
  return json.access_token
}

const timestamp = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

export const mpesaStkProvider: PaymentProvider = {
  method: 'mpesa_stk',
  get configured() {
    return Boolean(
      process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_SHORTCODE &&
        process.env.MPESA_PASSKEY,
    )
  },

  async init(args: InitPaymentArgs): Promise<InitPaymentResult> {
    if (!this.configured) throw new Error('M-Pesa (Daraja) is not configured.')
    const phone = args.phone ? normalizeKePhone(args.phone) : null
    if (!phone) throw new Error('A valid M-Pesa phone number is required.')

    const token = await getToken()
    const ts = timestamp()
    const shortcode = process.env.MPESA_SHORTCODE as string
    const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString('base64')

    const res = await fetch(`${host()}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(args.amountKES),
        PartyA: phone.replace('+', ''),
        PartyB: shortcode,
        PhoneNumber: phone.replace('+', ''),
        CallBackURL: process.env.MPESA_CALLBACK_URL || args.callbackUrl,
        AccountReference: args.reference,
        TransactionDesc: args.description.slice(0, 13),
      }),
    })
    const json = (await res.json()) as {
      CheckoutRequestID?: string
      ResponseDescription?: string
      errorMessage?: string
    }
    if (!json.CheckoutRequestID) {
      throw new Error(`STK push failed: ${json.errorMessage ?? json.ResponseDescription ?? 'unknown'}`)
    }
    return {
      mode: 'stk_push',
      providerRef: json.CheckoutRequestID,
      message: 'Check your phone and enter your M-Pesa PIN to complete payment.',
    }
  },

  async verify(checkoutRequestId: string): Promise<VerifyResult> {
    const token = await getToken()
    const ts = timestamp()
    const shortcode = process.env.MPESA_SHORTCODE as string
    const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${ts}`).toString('base64')
    const res = await fetch(`${host()}/mpesa/stkpushquery/v1/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: ts,
        CheckoutRequestID: checkoutRequestId,
      }),
    })
    const json = (await res.json()) as { ResultCode?: string }
    return { paid: json.ResultCode === '0', raw: json }
  },
}
