import type { GlobalConfig } from 'payload'
import { anyone, isStaff } from '@/access'

export const Homepage: GlobalConfig = {
  slug: 'homepage',
  admin: { group: 'Content' },
  access: { read: anyone, update: isStaff },
  fields: [
    {
      name: 'slides',
      type: 'array',
      labels: { singular: 'Slide', plural: 'Hero slides' },
      maxRows: 6,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true },
        { name: 'heading', type: 'text', required: true },
        { name: 'subheading', type: 'text' },
        {
          type: 'row',
          fields: [
            { name: 'ctaLabel', type: 'text', admin: { width: '50%' } },
            { name: 'ctaHref', type: 'text', admin: { width: '50%', placeholder: '/shop/cctv-cameras' } },
          ],
        },
      ],
    },
    {
      name: 'featuredCategories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { description: 'Category tiles shown below the hero. Leave blank to auto-pick nav categories.' },
    },
    {
      name: 'promoStrip',
      type: 'group',
      fields: [
        { name: 'enabled', type: 'checkbox', defaultValue: true },
        { name: 'text', type: 'text', defaultValue: 'Professional CCTV installation — book a site survey today.' },
        { name: 'ctaLabel', type: 'text', defaultValue: 'Request installation' },
        { name: 'ctaHref', type: 'text', defaultValue: '/services/request' },
      ],
    },
    {
      name: 'testimonials',
      type: 'array',
      fields: [
        { name: 'quote', type: 'textarea', required: true },
        { name: 'author', type: 'text', required: true },
        { name: 'role', type: 'text' },
      ],
    },
    {
      name: 'whyChooseUs',
      type: 'array',
      labels: { singular: 'Reason', plural: 'Why choose us' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'body', type: 'text', required: true },
        {
          name: 'icon',
          type: 'select',
          defaultValue: 'shield',
          options: ['shield', 'truck', 'wrench', 'headset', 'badge-check', 'clock'],
        },
      ],
    },
  ],
}
