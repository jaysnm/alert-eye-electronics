import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '@/access'
import { slugField } from '@/fields/slug'

/** Simple content pages: About, Contact, Delivery & Returns, Warranty, Privacy… */
export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'slug'], group: 'Content' },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    { name: 'intro', type: 'textarea' },
    { name: 'body', type: 'richText', required: true },
  ],
}
