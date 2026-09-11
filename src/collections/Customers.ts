import type { CollectionConfig } from 'payload'
import { isStaff, isStaffFieldLevel, selfOrStaff, anyone } from '@/access'

/**
 * Storefront customer accounts. Separate auth collection so customers never
 * touch the admin panel.
 */
export const Customers: CollectionConfig = {
  slug: 'customers',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 30,
    cookies: {
      sameSite: 'Lax',
    },
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'phone', 'createdAt'],
    group: 'Sales',
  },
  access: {
    read: selfOrStaff,
    create: anyone, // public sign-up
    update: selfOrStaff,
    delete: isStaff,
    admin: () => false,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'phone',
      type: 'text',
      required: true,
      admin: { description: 'Kenyan format, e.g. 0712345678 or +254712345678.' },
    },
    {
      name: 'addresses',
      type: 'array',
      labels: { singular: 'Address', plural: 'Addresses' },
      fields: [
        { name: 'label', type: 'text', admin: { placeholder: 'Home / Office' } },
        { name: 'recipient', type: 'text', required: true },
        { name: 'phone', type: 'text', required: true },
        { name: 'town', type: 'text', required: true },
        { name: 'area', type: 'text' },
        { name: 'details', type: 'textarea', label: 'Street / building / directions' },
        { name: 'isDefault', type: 'checkbox' },
      ],
    },
    {
      name: 'notes',
      type: 'textarea',
      access: { read: isStaffFieldLevel, update: isStaffFieldLevel },
      admin: { description: 'Internal notes (not visible to the customer).' },
    },
  ],
}
