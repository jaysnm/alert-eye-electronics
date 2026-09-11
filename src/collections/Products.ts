import type { CollectionConfig } from 'payload'
import { isStaff, publishedOrStaff } from '@/access'
import { slugField } from '@/fields/slug'

const LOW_STOCK_THRESHOLD = 3

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'priceKES', 'stockQty', 'category', 'status'],
    group: 'Catalog',
    listSearchableFields: ['title', 'sku', 'shortDescription'],
  },
  access: {
    read: publishedOrStaff,
    create: isStaff,
    update: isStaff,
    delete: isStaff,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      type: 'row',
      fields: [
        {
          name: 'priceKES',
          type: 'number',
          required: true,
          min: 0,
          label: 'Price (KES)',
          admin: { width: '50%' },
        },
        {
          name: 'compareAtPriceKES',
          type: 'number',
          min: 0,
          label: 'Compare-at price (KES)',
          admin: { width: '50%', description: 'Original price — shown struck-through to signal a discount.' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'sku', type: 'text', unique: true, admin: { width: '50%' } },
        {
          name: 'stockQty',
          type: 'number',
          required: true,
          defaultValue: 0,
          min: 0,
          label: 'Stock quantity',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      maxLength: 300,
      admin: { description: 'One or two lines shown on product cards and search results.' },
    },
    { name: 'description', type: 'richText', admin: { description: 'Full product description.' } },
    {
      name: 'images',
      type: 'array',
      minRows: 0,
      labels: { singular: 'Image', plural: 'Images' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
    {
      name: 'specs',
      type: 'array',
      labels: { singular: 'Spec', plural: 'Specifications' },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'label', type: 'text', required: true, admin: { width: '40%' } },
            { name: 'value', type: 'text', required: true, admin: { width: '60%' } },
          ],
        },
      ],
    },
    {
      name: 'warranty',
      type: 'text',
      admin: { description: 'e.g. "1 year manufacturer warranty".' },
    },
    // Sidebar
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      admin: { position: 'sidebar', description: 'Show in the "Featured" section on the homepage.' },
    },
    {
      name: 'lowStock',
      type: 'checkbox',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: `Auto-set when stock is at or below ${LOW_STOCK_THRESHOLD}.`,
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (typeof data.stockQty === 'number') {
          data.lowStock = data.stockQty <= LOW_STOCK_THRESHOLD
        }
        return data
      },
    ],
  },
}
