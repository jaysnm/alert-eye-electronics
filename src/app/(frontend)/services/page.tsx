import type { Metadata } from 'next'
import Link from 'next/link'
import { getServiceTypes } from '@/lib/queries'
import { ServiceCard } from '@/components/services/ServiceCard'

export const metadata: Metadata = {
  title: 'Installation & Service',
  description: 'CCTV installation, repairs, networking and more — professional service across Kenya.',
}
export const revalidate = 300

export default async function ServicesPage() {
  const services = await getServiceTypes()

  return (
    <div className="container-page py-8">
      <div className="rounded-2xl bg-navy-900 text-white p-8 sm:p-12 mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold max-w-xl">
          Professional installation & technical service
        </h1>
        <p className="mt-3 text-slate-200 max-w-lg">
          Our certified technicians handle CCTV, access control, networking and electrical work — with a
          workmanship warranty. Request a quote and we&apos;ll schedule a site visit.
        </p>
        <Link
          href="/services/request"
          className="mt-6 inline-block rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold px-5 py-2.5"
        >
          Request a service
        </Link>
      </div>

      {services.length === 0 ? (
        <p className="text-slate-500">Services will be listed here soon. Contact us for any installation needs.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </div>
  )
}
