import Image from 'next/image'
import type { Media, Product } from '@/payload-types'
import { cn } from '@/lib/utils'

export const pickImage = (
  m: number | Media | null | undefined,
  size?: 'thumbnail' | 'card' | 'feature' | 'og',
): { url: string; alt: string } | null => {
  if (!m || typeof m === 'number') return null
  const url = (size && m.sizes?.[size]?.url) || m.url
  if (!url) return null
  return { url, alt: m.alt || '' }
}

export const firstProductImage = (p: Product, size?: 'thumbnail' | 'card' | 'feature') =>
  pickImage(p.images?.[0]?.image, size)

export const ProductImage = ({
  src,
  className,
  sizes = '(max-width: 640px) 50vw, 300px',
}: {
  src: { url: string; alt: string } | null
  className?: string
  sizes?: string
}) => {
  if (!src) {
    return (
      <div className={cn('grid place-items-center bg-slate-100 text-slate-300 text-xs', className)}>
        No image
      </div>
    )
  }
  return (
    <Image
      src={src.url}
      alt={src.alt}
      fill
      sizes={sizes}
      className={cn('object-contain', className)}
    />
  )
}
