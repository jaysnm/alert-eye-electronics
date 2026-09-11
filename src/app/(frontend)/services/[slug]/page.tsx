import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'
import { getServiceTypeBySlug } from '@/lib/queries'
import { RichText } from '@/components/site/RichText'
import { ProductImage, pickImage } from '@/components/shop/ProductImage'
import { formatKES } from '@/lib/format'

export const revalidate = 300

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = await getServiceTypeBySlug(slug)
  return { title: s?.name ?? 'Service', description: s?.summary ?? undefined }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = await getServiceTypeBySlug(slug)
  if (!service) notFound()

  const img = pickImage(service.image as never, 'feature')

  return (
    <div className="container-page py-8">
      <nav className="text-xs text-slate-500 mb-4">
        <Link href="/services" className="hover:underline">Services</Link> / <span className="text-slate-700">{service.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="relative aspect-[16/10] rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
          <ProductImage src={img} sizes="(max-width:1024px) 100vw, 560px" className="object-cover" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{service.name}</h1>
          <p className="mt-2 text-lg font-semibold text-navy-700">
            {service.basePriceFromKES ? `From ${formatKES(service.basePriceFromKES)}` : 'Custom quote'}
          </p>
          {service.summary && <p className="mt-3 text-slate-600">{service.summary}</p>}

          {service.bullets && service.bullets.length > 0 && (
            <ul className="mt-5 space-y-2">
              {service.bullets.map((b) => (
                <li key={b.id} className="flex gap-2 text-sm text-slate-700">
                  <Check size={18} className="text-green-600 shrink-0" /> {b.text}
                </li>
              ))}
            </ul>
          )}

          <Link
            href={`/services/request?service=${service.slug}`}
            className="mt-6 inline-block rounded-lg bg-navy-900 text-white font-semibold px-6 py-3"
          >
            Request this service
          </Link>
        </div>
      </div>

      {service.description && (
        <div className="mt-12 max-w-3xl">
          <RichText data={service.description} />
        </div>
      )}
    </div>
  )
}
