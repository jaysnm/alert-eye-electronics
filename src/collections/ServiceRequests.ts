import type { CollectionConfig } from 'payload'
import { hasRole, isStaff, serviceRequestRead } from '@/access'
import { timelineField, appendTimeline } from '@/fields/timeline'
import { serviceRequestNumber } from '@/lib/refnum'
import { sendEmail, staffInbox } from '@/lib/email'
import { formatKES } from '@/lib/format'

export const SERVICE_STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'Quoted', value: 'quoted' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'In progress', value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
] as const

const CUSTOMER_FACING_MESSAGE: Record<string, string> = {
  quoted: 'We have prepared a quote for your service request. Log in to your account to review and accept it.',
  scheduled: 'Your service visit has been scheduled. Check your account for the date and assigned technician.',
  in_progress: 'Our technician has started work on your service request.',
  completed: 'Your service request is complete. Thank you for choosing Alert Eye Electronics.',
  cancelled: 'Your service request has been cancelled. Contact us if this is unexpected.',
}

export const ServiceRequests: CollectionConfig = {
  slug: 'service-requests',
  labels: { singular: 'Service Request', plural: 'Service Requests' },
  admin: {
    useAsTitle: 'requestNumber',
    defaultColumns: ['requestNumber', 'serviceType', 'contactName', 'status', 'scheduledStart', 'assignedTechnician'],
    group: 'Services',
    listSearchableFields: ['requestNumber', 'contactName', 'contactPhone'],
  },
  access: {
    read: serviceRequestRead,
    create: isStaff, // public submissions go through a server action with overrideAccess
    update: ({ req: { user } }) => {
      const role = (user as { role?: string; collection?: string })?.role
      if (user && (user as { collection?: string }).collection === 'users') {
        if (role === 'technician') return { assignedTechnician: { equals: user.id } }
        return true
      }
      return false
    },
    delete: hasRole('admin', 'manager'),
  },
  fields: [
    { name: 'requestNumber', type: 'text', unique: true, index: true, admin: { readOnly: true, position: 'sidebar' } },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'new',
      options: [...SERVICE_STATUSES],
      admin: { position: 'sidebar' },
    },
    {
      name: 'serviceType',
      type: 'relationship',
      relationTo: 'service-types',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'assignedTechnician',
      type: 'relationship',
      relationTo: 'users',
      filterOptions: { role: { equals: 'technician' } },
      admin: { position: 'sidebar' },
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'customers',
      admin: { position: 'sidebar', description: 'Linked account (blank if submitted as a guest).' },
    },
    {
      type: 'collapsible',
      label: 'Contact',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'contactName', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'contactPhone', type: 'text', required: true, admin: { width: '50%' } },
          ],
        },
        { name: 'contactEmail', type: 'email' },
      ],
    },
    {
      name: 'siteAddress',
      type: 'group',
      label: 'Site location',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'town', type: 'text', required: true, admin: { width: '50%' } },
            { name: 'area', type: 'text', admin: { width: '50%', placeholder: 'Estate / building' } },
          ],
        },
        { name: 'details', type: 'textarea', label: 'Directions / landmark' },
      ],
    },
    { name: 'description', type: 'textarea', required: true, label: 'What do you need done?' },
    {
      name: 'photos',
      type: 'array',
      labels: { singular: 'Photo', plural: 'Site photos' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    { name: 'preferredDate', type: 'date', admin: { date: { pickerAppearance: 'dayOnly' } } },
    // Quote
    {
      name: 'quote',
      type: 'group',
      admin: { condition: (data) => ['quoted', 'scheduled', 'in_progress', 'completed'].includes(data?.status) },
      fields: [
        {
          name: 'lineItems',
          type: 'array',
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'label', type: 'text', required: true, admin: { width: '50%' } },
                { name: 'qty', type: 'number', required: true, defaultValue: 1, admin: { width: '20%' } },
                { name: 'unitPriceKES', type: 'number', required: true, admin: { width: '30%' } },
              ],
            },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'labourKES', type: 'number', defaultValue: 0, admin: { width: '50%' } },
            { name: 'totalKES', type: 'number', admin: { width: '50%', readOnly: true } },
          ],
        },
        {
          type: 'row',
          fields: [
            { name: 'depositKES', type: 'number', defaultValue: 0, admin: { width: '33%', description: 'Amount payable up front to book.' } },
            { name: 'depositPaid', type: 'checkbox', admin: { width: '33%' } },
            { name: 'validUntil', type: 'date', admin: { width: '34%', date: { pickerAppearance: 'dayOnly' } } },
          ],
        },
        { name: 'depositReference', type: 'text', admin: { readOnly: true } },
        { name: 'acceptedAt', type: 'date', admin: { readOnly: true, date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    // Scheduling
    {
      type: 'row',
      admin: { condition: (data) => ['scheduled', 'in_progress', 'completed'].includes(data?.status) },
      fields: [
        { name: 'scheduledStart', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
        { name: 'scheduledEnd', type: 'date', admin: { width: '50%', date: { pickerAppearance: 'dayAndTime' } } },
      ],
    },
    {
      name: 'visitReport',
      type: 'textarea',
      admin: { description: 'Technician notes after the visit.', condition: (data) => ['in_progress', 'completed'].includes(data?.status) },
    },
    timelineField,
  ],
  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (operation === 'create' && !data.requestNumber) data.requestNumber = serviceRequestNumber()

        if (data.quote) {
          const items = Array.isArray(data.quote.lineItems) ? data.quote.lineItems : []
          const itemsTotal = items.reduce(
            (s: number, li: { qty?: number; unitPriceKES?: number }) => s + (li.qty ?? 0) * (li.unitPriceKES ?? 0),
            0,
          )
          data.quote.totalKES = itemsTotal + (data.quote.labourKES ?? 0)
        }

        if (operation === 'create') {
          data.timeline = appendTimeline(data.timeline, { event: 'Request submitted', by: 'system' })
        } else if (originalDoc && originalDoc.status !== data.status) {
          data.timeline = appendTimeline(data.timeline, {
            event: `Status → ${data.status}`,
            by: 'staff',
          })
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, previousDoc, operation, req }) => {
        const { payload } = req

        if (operation === 'create') {
          await sendEmail({
            payload,
            to: staffInbox(),
            subject: `New service request ${doc.requestNumber}`,
            title: `New service request`,
            bodyHtml: `<p><strong>${doc.requestNumber}</strong> — ${doc.contactName} (${doc.contactPhone})</p>
              <p>Location: ${doc.siteAddress?.town ?? ''} ${doc.siteAddress?.area ?? ''}</p>
              <p>${doc.description}</p>`,
          })
          if (doc.contactEmail) {
            await sendEmail({
              payload,
              to: doc.contactEmail,
              subject: `We received your service request ${doc.requestNumber}`,
              title: `Request received`,
              bodyHtml: `<p>Hi ${doc.contactName}, we've logged your request <strong>${doc.requestNumber}</strong> and will send a quote shortly.</p>`,
            })
          }
          return
        }

        const statusChanged = previousDoc?.status !== doc.status
        if (statusChanged && doc.contactEmail && CUSTOMER_FACING_MESSAGE[doc.status]) {
          let extra = ''
          if (doc.status === 'quoted' && doc.quote?.totalKES) {
            extra = `<p>Quote total: <strong>${formatKES(doc.quote.totalKES)}</strong>${doc.quote.depositKES ? ` (deposit ${formatKES(doc.quote.depositKES)})` : ''}.</p>`
          }
          if (doc.status === 'scheduled' && doc.scheduledStart) {
            extra = `<p>Scheduled for <strong>${new Date(doc.scheduledStart).toLocaleString('en-KE')}</strong>.</p>`
          }
          await sendEmail({
            payload,
            to: doc.contactEmail,
            subject: `Service request ${doc.requestNumber} — ${doc.status.replace('_', ' ')}`,
            title: `Update on ${doc.requestNumber}`,
            bodyHtml: `<p>${CUSTOMER_FACING_MESSAGE[doc.status]}</p>${extra}`,
          })
        }
      },
    ],
  },
}
