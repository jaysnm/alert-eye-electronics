import type { PaymentMethod, PaymentProvider, InitPaymentArgs, InitPaymentResult } from './types'
import { paystackProvider } from './paystack'
import { mpesaStkProvider } from './mpesa'

const manualInstructions = (method: PaymentMethod, args: InitPaymentArgs): string => {
  switch (method) {
    case 'manual_mpesa':
      return `Go to M-Pesa > Lipa na M-Pesa > Pay Bill. Business no: ${process.env.NEXT_PUBLIC_MPESA_PAYBILL || '<paybill>'}, Account: ${args.reference}, Amount: KES ${Math.round(args.amountKES)}. We confirm and process your order once payment reflects.`
    case 'bank_transfer':
      return `Transfer KES ${Math.round(args.amountKES)} to ${process.env.NEXT_PUBLIC_BANK_DETAILS || '<bank details>'}. Use "${args.reference}" as the reference and email the slip to ${process.env.EMAIL_STAFF_INBOX || 'sales@alerteye.co.ke'}.`
    case 'cash_on_delivery':
      return `Pay KES ${Math.round(args.amountKES)} in cash or M-Pesa when your order is delivered or collected. Available within Nairobi and at our shop.`
    default:
      return 'Follow up with our team to complete payment.'
  }
}

const manualProvider = (method: PaymentMethod): PaymentProvider => ({
  method,
  configured: true,
  async init(args: InitPaymentArgs): Promise<InitPaymentResult> {
    return { mode: 'manual', instructions: manualInstructions(method, args) }
  },
})

export const getPaymentProvider = (method: PaymentMethod): PaymentProvider => {
  switch (method) {
    case 'paystack':
      return paystackProvider
    case 'mpesa_stk':
      return mpesaStkProvider
    default:
      return manualProvider(method)
  }
}

/** Methods offered to shoppers at checkout, based on what is configured. */
export const availablePaymentMethods = (): { value: PaymentMethod; label: string }[] => {
  const list: { value: PaymentMethod; label: string }[] = []
  if (paystackProvider.configured) list.push({ value: 'paystack', label: 'Card or M-Pesa (Paystack)' })
  if (mpesaStkProvider.configured) list.push({ value: 'mpesa_stk', label: 'M-Pesa STK push' })
  list.push({ value: 'manual_mpesa', label: 'M-Pesa Paybill (manual)' })
  list.push({ value: 'bank_transfer', label: 'Bank transfer' })
  list.push({ value: 'cash_on_delivery', label: 'Pay on delivery / pickup' })
  return list
}

export type { PaymentMethod } from './types'
