import type { GlobalConfig } from 'payload'
import { anyone, isStaff } from '@/access'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: isStaff },
  fields: [
    { name: 'announcement', type: 'text', admin: { description: 'Scrolling bar at the very top of the site. Leave blank to hide.' } },
    {
      type: 'collapsible',
      label: 'Contact',
      fields: [
        { name: 'phone', type: 'text', defaultValue: '+254 700 000 000' },
        { name: 'whatsapp', type: 'text', defaultValue: '+254700000000', admin: { description: 'Number for the floating WhatsApp button and "enquire" links.' } },
        { name: 'email', type: 'email', defaultValue: 'sales@alerteye.co.ke' },
        { name: 'addressLine', type: 'text', defaultValue: 'Nairobi CBD, Kenya' },
        { name: 'mapUrl', type: 'text', admin: { description: 'Google Maps link or embed URL.' } },
        { name: 'hours', type: 'text', defaultValue: 'Mon–Sat 8:00am – 6:00pm' },
      ],
    },
    {
      name: 'socials',
      type: 'array',
      fields: [
        { name: 'platform', type: 'select', options: ['facebook', 'instagram', 'tiktok', 'x', 'youtube', 'linkedin'] },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'deliveryRates',
      type: 'array',
      labels: { singular: 'Rate', plural: 'Delivery rates' },
      admin: { description: 'Shown on the delivery page and used as defaults at checkout.' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '60%' } },
            { name: 'feeKES', type: 'number', required: true, admin: { width: '40%' } },
          ],
        },
      ],
    },
    {
      type: 'collapsible',
      label: 'Trust badges (footer / homepage)',
      fields: [
        {
          name: 'trustBadges',
          type: 'array',
          fields: [
            { name: 'title', type: 'text', required: true },
            { name: 'subtitle', type: 'text' },
            {
              name: 'icon',
              type: 'select',
              defaultValue: 'truck',
              options: ['truck', 'shield', 'headset', 'badge-check', 'credit-card', 'wrench'],
            },
          ],
        },
      ],
    },
  ],
}
