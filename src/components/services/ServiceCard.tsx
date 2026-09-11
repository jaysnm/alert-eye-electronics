import Link from 'next/link'
import type { ServiceType } from '@/payload-types'
import { formatKES } from '@/lib/format'
import { ProductImage, pickImage } from '@/components/shop/ProductImage'

export const ServiceCard = ({ service }: { service: ServiceType }) => {
  const img = pickImage(service.image as never, 'card')
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-md transition">
      <Link href={`/services/${service.slug}`} className="relative aspect-[16/10] bg-slate-100">
        <ProductImage src={img} sizes="(max-width:640px) 100vw, 380px" className="object-cover" />
      </Link>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="font-semibold text-navy-900">{service.name}</h3>
        {service.summary && <p className="text-sm text-slate-600 line-clamp-2">{service.summary}</p>}
        <p className="text-sm font-semibold text-navy-700 mt-1">
          {service.basePriceFromKES ? `From ${formatKES(service.basePriceFromKES)}` : 'Request a quote'}
        </p>
        <div className="mt-auto pt-2 flex gap-2">
          <Link
            href={`/services/${service.slug}`}
            className="text-sm font-semibold text-navy-500 hover:underline"
          >
            Details
          </Link>
          <Link
            href={`/services/request?service=${service.slug}`}
            className="ml-auto rounded-lg bg-navy-900 text-white text-sm font-semibold px-3 py-1.5"
          >
            Request
          </Link>
        </div>
      </div>
    </div>
  )
}
