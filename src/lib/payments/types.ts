export type PaymentMethod =
  | 'paystack'
  | 'mpesa_stk'
  | 'manual_mpesa'
  | 'bank_transfer'
  | 'cash_on_delivery'

export type InitPaymentArgs = {
  reference: string
  amountKES: number
  email?: string | null
  phone?: string | null
  description: string
  callbackUrl: string
}

export type InitPaymentResult =
  | { mode: 'redirect'; url: string; providerRef?: string }
  | { mode: 'stk_push'; message: string; providerRef: string }
  | { mode: 'manual'; instructions: string }

export type VerifyResult = { paid: boolean; amountKES?: number; raw: unknown }

export interface PaymentProvider {
  readonly method: PaymentMethod
  /** True when the provider has the config it needs to run live. */
  readonly configured: boolean
  init(args: InitPaymentArgs): Promise<InitPaymentResult>
  verify?(reference: string): Promise<VerifyResult>
}
