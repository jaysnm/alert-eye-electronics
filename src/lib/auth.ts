import 'server-only'
import { headers as nextHeaders } from 'next/headers'
import { getPayload } from './payload'

export const getCurrentUser = async () => {
  const payload = await getPayload()
  const headers = await nextHeaders()
  const { user } = await payload.auth({ headers })
  return user ?? null
}

export const getCurrentCustomer = async () => {
  const user = await getCurrentUser()
  if (user && (user as { collection?: string }).collection === 'customers') return user
  return null
}
