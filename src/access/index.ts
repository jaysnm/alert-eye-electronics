import type { Access, FieldAccess, Where } from 'payload'

type StaffRole = 'admin' | 'manager' | 'sales' | 'technician'

const roleOf = (user: unknown): StaffRole | undefined => {
  if (user && typeof user === 'object' && 'role' in user && 'collection' in user) {
    if ((user as { collection?: string }).collection === 'users') {
      return (user as { role?: StaffRole }).role
    }
  }
  return undefined
}

export const isStaff: Access = ({ req: { user } }) => roleOf(user) !== undefined

export const hasRole =
  (...roles: StaffRole[]): Access =>
  ({ req: { user } }) => {
    const role = roleOf(user)
    return role ? roles.includes(role) : false
  }

export const isAdmin: Access = ({ req: { user } }) => roleOf(user) === 'admin'

export const isAdminOrManager: Access = ({ req: { user } }) =>
  ['admin', 'manager'].includes(roleOf(user) ?? '')

export const isAdminFieldLevel: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'

export const isStaffFieldLevel: FieldAccess = ({ req: { user } }) => roleOf(user) !== undefined

/** Public read for published storefront content. */
export const publishedOrStaff: Access = ({ req: { user } }) => {
  if (roleOf(user)) return true
  return { status: { equals: 'active' } }
}

/** A customer can read their own row; staff can read all. */
export const selfOrStaff: Access = ({ req: { user } }) => {
  if (roleOf(user)) return true
  if (user && (user as { collection?: string }).collection === 'customers') {
    return { id: { equals: user.id } }
  }
  return false
}

/** Orders / service requests: customer sees their own, staff see all. */
export const ownerOrStaff =
  (ownerField = 'customer'): Access =>
  ({ req: { user } }) => {
    if (roleOf(user)) return true
    if (user && (user as { collection?: string }).collection === 'customers') {
      return { [ownerField]: { equals: user.id } }
    }
    return false
  }

/** Technicians only see service requests assigned to them; other staff see all. */
export const serviceRequestRead: Access = ({ req: { user } }) => {
  const role = roleOf(user)
  if (role && role !== 'technician') return true
  if (role === 'technician') return { assignedTechnician: { equals: user!.id } } as Where
  if (user && (user as { collection?: string }).collection === 'customers') {
    return { customer: { equals: user.id } } as Where
  }
  return false
}

export const anyone: Access = () => true
