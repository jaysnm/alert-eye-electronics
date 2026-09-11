import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export type MediaLike = { url?: string | null; alt?: string | null; sizes?: Record<string, { url?: string | null }> } | string | number | null | undefined

export const mediaUrl = (m: MediaLike, size?: string): string | null => {
  if (!m || typeof m === 'string' || typeof m === 'number') return null
  if (size && m.sizes?.[size]?.url) return m.sizes[size]!.url ?? null
  return m.url ?? null
}

export const mediaAlt = (m: MediaLike): string => {
  if (!m || typeof m === 'string' || typeof m === 'number') return ''
  return m.alt ?? ''
}
