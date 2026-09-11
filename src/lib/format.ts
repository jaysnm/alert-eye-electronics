export const formatKES = (amount: number | null | undefined): string => {
  const n = typeof amount === 'number' && !Number.isNaN(amount) ? amount : 0
  return `KES ${n.toLocaleString('en-KE', { maximumFractionDigits: 0 })}`
}

export const discountPct = (price: number, compareAt?: number | null): number | null => {
  if (!compareAt || compareAt <= price) return null
  return Math.round(((compareAt - price) / compareAt) * 100)
}

/** Normalise a Kenyan phone number to +2547######## / +2541######## form. */
export const normalizeKePhone = (raw: string): string | null => {
  const digits = raw.replace(/\D/g, '')
  if (/^254\d{9}$/.test(digits)) return `+${digits}`
  if (/^0\d{9}$/.test(digits)) return `+254${digits.slice(1)}`
  if (/^\d{9}$/.test(digits)) return `+254${digits}`
  return null
}

export const waLink = (phone: string, text?: string): string => {
  const p = phone.replace(/\D/g, '')
  return `https://wa.me/${p}${text ? `?text=${encodeURIComponent(text)}` : ''}`
}
