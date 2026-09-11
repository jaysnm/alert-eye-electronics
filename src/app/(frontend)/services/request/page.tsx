import type { Metadata } from 'next'
import { getServiceTypes } from '@/lib/queries'
import { ServiceRequestForm } from '@/components/services/ServiceRequestForm'

export const metadata: Metadata = { title: 'Request a service' }
export const revalidate = 300

export default async function ServiceRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>
}) {
  const [{ service }, services] = await Promise.all([searchParams, getServiceTypes()])
  const preselect = services.find((s) => s.slug === service)?.id ?? null

  return (
    <div className="container-page py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-navy-900">Request a service</h1>
      <p className="mt-2 text-slate-600">
        Tell us what you need. We&apos;ll review, send a quote and schedule a technician.
      </p>
      <div className="mt-6">
        <ServiceRequestForm
          services={services.map((s) => ({ id: s.id, name: s.name }))}
          preselectId={preselect}
        />
      </div>
    </div>
  )
}
