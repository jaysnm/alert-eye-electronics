import type { CollectionConfig } from 'payload'
import { anyone, isStaff } from '@/access'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Catalog' },
  access: {
    read: anyone,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  upload: {
    // When S3 storage is configured the files live on R2; otherwise on local disk.
    staticDir: 'media',
    mimeTypes: ['image/*', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 300, height: 300, position: 'centre' },
      { name: 'card', width: 640, height: 640, position: 'centre' },
      { name: 'feature', width: 1200 },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
    focalPoint: true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: { description: 'Describe the image for accessibility and SEO.' },
    },
  ],
}
