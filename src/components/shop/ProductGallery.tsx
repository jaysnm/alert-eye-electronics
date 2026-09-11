'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export const ProductGallery = ({ images }: { images: { url: string; alt: string }[] }) => {
  const [active, setActive] = useState(0)
  if (images.length === 0) {
    return <div className="aspect-square rounded-xl bg-slate-100 grid place-items-center text-slate-300">No image</div>
  }
  return (
    <div>
      <div className="relative aspect-square rounded-xl border border-slate-200 bg-white overflow-hidden">
        <Image
          src={images[active].url}
          alt={images[active].alt}
          fill
          priority
          sizes="(max-width:1024px) 100vw, 560px"
          className="object-contain p-4"
        />
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                'relative h-16 w-16 rounded-lg border bg-white overflow-hidden',
                i === active ? 'border-navy-900' : 'border-slate-200',
              )}
            >
              <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
