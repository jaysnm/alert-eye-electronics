'use server'

import { cookies, headers as nextHeaders } from 'next/headers'
import { getPayload } from '@/lib/payload'
import { normalizeKePhone } from '@/lib/format'

type AuthResult = { ok: true } | { ok: false; error: string }

export async function loginCustomer(email: string, password: string): Promise<AuthResult> {
  const payload = await getPayload()
  try {
    const result = await payload.login({
      collection: 'customers',
      data: { email, password },
    })
    if (result.token) {
      const jar = await cookies()
      jar.set('payload-token', result.token, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30,
      })
    }
    return { ok: true }
  } catch {
    return { ok: false, error: 'Invalid email or password.' }
  }
}

export async function registerCustomer(data: {
  name: string
  email: string
  phone: string
  password: string
}): Promise<AuthResult> {
  const phone = normalizeKePhone(data.phone)
  if (!phone) return { ok: false, error: 'Enter a valid Kenyan phone number.' }
  if (data.password.length < 8) return { ok: false, error: 'Password must be at least 8 characters.' }

  const payload = await getPayload()
  try {
    await payload.create({
      collection: 'customers',
      data: { name: data.name, email: data.email, phone, password: data.password },
      overrideAccess: true,
    })
  } catch {
    return { ok: false, error: 'Could not create account — the email may already be registered.' }
  }
  return loginCustomer(data.email, data.password)
}

export async function logoutCustomer(): Promise<void> {
  const jar = await cookies()
  jar.delete('payload-token')
}

export async function getSessionCustomer() {
  const payload = await getPayload()
  const { user } = await payload.auth({ headers: await nextHeaders() })
  if (user && (user as { collection?: string }).collection === 'customers') return user
  return null
}
