'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Slide = {
  image: string
  alt: string
  heading: string
  subheading?: string | null
  ctaLabel?: string | null
  ctaHref?: string | null
}

export const Hero = ({ slides }: { slides: Slide[] }) => {
  const [i, setI] = useState(0)
  const n = slides.length

  useEffect(() => {
    if (n <= 1) return
    const t = setInterval(() => setI((v) => (v + 1) % n), 6000)
    return () => clearInterval(t)
  }, [n])

  if (n === 0) {
    return (
      <div className="rounded-2xl bg-navy-900 text-white p-8 sm:p-12">
        <h1 className="text-2xl sm:text-4xl font-bold max-w-xl">
          CCTV, security systems &amp; electronics — supplied and installed across Kenya
        </h1>
        <p className="mt-3 text-slate-200 max-w-lg">
          Shop trusted brands and book professional installation with a warranty.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/shop" className="rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold px-5 py-2.5">
            Shop now
          </Link>
          <Link href="/services/request" className="rounded-lg bg-white/10 text-white font-semibold px-5 py-2.5">
            Request installation
          </Link>
        </div>
      </div>
    )
  }

  const s = slides[i]
  return (
    <div className="relative overflow-hidden rounded-2xl bg-navy-900 min-h-[260px] sm:min-h-[380px]">
      <Image src={s.image} alt={s.alt} fill priority sizes="(max-width:1200px) 100vw, 1200px" className="object-cover opacity-60" />
      <div className="relative p-8 sm:p-12 max-w-xl">
        <h1 className="text-2xl sm:text-4xl font-bold text-white">{s.heading}</h1>
        {s.subheading && <p className="mt-3 text-slate-100">{s.subheading}</p>}
        {s.ctaLabel && s.ctaHref && (
          <Link
            href={s.ctaHref}
            className="mt-6 inline-block rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold px-5 py-2.5"
          >
            {s.ctaLabel}
          </Link>
        )}
      </div>
      {n > 1 && (
        <>
          <button
            onClick={() => setI((v) => (v - 1 + n) % n)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setI((v) => (v + 1) % n)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-1.5 text-white hover:bg-white/30"
            aria-label="Next slide"
          >
            <ChevronRight size={20} />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all ${idx === i ? 'w-5 bg-[color:var(--accent)]' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
