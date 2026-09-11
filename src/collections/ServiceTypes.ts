import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '@/access'
import { slugField } from '@/fields/slug'

/**
 * Catalog of services offered (CCTV installation, repairs, networking, etc.).
 * Shown on /services and referenced by service requests.
 */
export const ServiceTypes: CollectionConfig = {
  slug: 'service-types',
  labels: { singular: 'Service', plural: 'Services' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'basePriceFromKES', 'active'],
    group: 'Services',
  },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'Short line shown on the services grid.' },
    },
    { name: 'description', type: 'richText' },
    { name: 'image', type: 'upload', relationTo: 'media' },
    {
      name: 'basePriceFromKES',
      type: 'number',
      min: 0,
      label: 'From price (KES)',
      admin: { description: 'Indicative starting price shown as "from KES …". Leave blank for "Request a quote".' },
    },
    {
      name: 'bullets',
      type: 'array',
      labels: { singular: 'Point', plural: 'What’s included' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
    { name: 'active', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
    { name: 'displayOrder', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
