'use server'

import { z } from 'zod'
import { getPayload } from '@/lib/payload'
import { getCurrentCustomer } from '@/lib/auth'
import { normalizeKePhone } from '@/lib/format'

const schema = z.object({
  serviceTypeId: z.union([z.string(), z.number()]),
  contact: z.object({
    name: z.string().min(2).max(120),
    phone: z.string().min(7).max(20),
    email: z.string().email().optional().or(z.literal('')),
  }),
  site: z.object({
    town: z.string().min(2).max(120),
    area: z.string().max(120).optional(),
    details: z.string().max(500).optional(),
  }),
  description: z.string().min(10).max(2000),
  preferredDate: z.string().optional(),
  photoIds: z.array(z.union([z.string(), z.number()])).max(8).optional(),
})

export type ServiceRequestInput = z.infer<typeof schema>

export type ServiceRequestResult =
  | { ok: false; error: string }
  | { ok: true; requestNumber: string }

export async function submitServiceRequest(input: ServiceRequestInput): Promise<ServiceRequestResult> {
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Please complete all required fields.' }
  const data = parsed.data

  const phone = normalizeKePhone(data.contact.phone)
  if (!phone) return { ok: false, error: 'Enter a valid Kenyan phone number.' }

  const payload = await getPayload()
  const customer = await getCurrentCustomer()

  const serviceType = await payload
    .findByID({ collection: 'service-types', id: data.serviceTypeId, depth: 0 })
    .catch(() => null)
  if (!serviceType) return { ok: false, error: 'Unknown service selected.' }

  const created = await payload.create({
    collection: 'service-requests',
    overrideAccess: true,
    data: {
      serviceType: serviceType.id,
      customer: customer?.id,
      contactName: data.contact.name,
      contactPhone: phone,
      contactEmail: data.contact.email || undefined,
      siteAddress: { town: data.site.town, area: data.site.area, details: data.site.details },
      description: data.description,
      preferredDate: data.preferredDate || undefined,
      photos: (data.photoIds ?? []).map((image) => ({ image: Number(image) })),
      status: 'new',
    },
  })

  return { ok: true, requestNumber: created.requestNumber as string }
}
