import type { CollectionConfig } from 'payload'
import { isAdmin, isStaff, isAdminFieldLevel } from '@/access'

/**
 * Staff accounts — the only collection that can access the admin panel.
 * Roles drive access control across every other collection.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
  },
  access: {
    read: isStaff,
    create: isAdmin,
    update: ({ req: { user }, id }) => {
      if (user && (user as { role?: string }).role === 'admin') return true
      return user?.id === id // users can edit themselves
    },
    delete: isAdmin,
  },
  fields: [
    { name: 'name', type: 'text', required: true },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'sales',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Manager', value: 'manager' },
        { label: 'Sales', value: 'sales' },
        { label: 'Technician', value: 'technician' },
      ],
      access: {
        create: isAdminFieldLevel,
        update: isAdminFieldLevel,
      },
      admin: { description: 'Admin: full access. Manager: catalog + orders + services. Sales: orders. Technician: assigned jobs only.' },
    },
    {
      name: 'phone',
      type: 'text',
      admin: { description: 'Used for job notifications / WhatsApp.' },
    },
  ],
}
