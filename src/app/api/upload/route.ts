import { NextResponse } from 'next/server'
import { getPayload } from '@/lib/payload'

export const dynamic = 'force-dynamic'

// Kept under Vercel's ~4.5MB serverless request-body limit (also applies on
// other hosts so behaviour is consistent everywhere this runs).
const MAX_BYTES = 4 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']

/** Public, rate-limited upload used by the service-request form. */
export async function POST(req: Request) {
  const form = await req.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 4MB)' }, { status: 413 })
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 415 })
  }

  const payload = await getPayload()
  const buffer = Buffer.from(await file.arrayBuffer())

  const doc = await payload.create({
    collection: 'media',
    overrideAccess: true,
    data: { alt: form.get('alt')?.toString() || 'Customer upload' },
    file: {
      data: buffer,
      name: file.name,
      mimetype: file.type,
      size: file.size,
    },
  })

  return NextResponse.json({ id: doc.id, url: doc.url })
}
