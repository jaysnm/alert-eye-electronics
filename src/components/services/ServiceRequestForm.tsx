'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Loader2, Upload, X } from 'lucide-react'
import { submitServiceRequest } from '@/actions/service-request'

type Service = { id: string | number; name: string }
type Photo = { id: string | number; url: string; name: string }

const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-500'

export const ServiceRequestForm = ({
  services,
  preselectId,
}: {
  services: Service[]
  preselectId: string | number | null
}) => {
  const [form, setForm] = useState({
    serviceTypeId: String(preselectId ?? services[0]?.id ?? ''),
    name: '',
    phone: '',
    email: '',
    town: '',
    area: '',
    details: '',
    description: '',
    preferredDate: '',
  })
  const [photos, setPhotos] = useState<Photo[]>([])
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ref, setRef] = useState<string | null>(null)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setUploading(true)
    setError(null)
    for (const file of Array.from(files).slice(0, 8 - photos.length)) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const json = await res.json()
        if (res.ok) setPhotos((p) => [...p, { id: json.id, url: json.url, name: file.name }])
        else setError(json.error ?? 'Upload failed')
      } catch {
        setError('Upload failed')
      }
    }
    setUploading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await submitServiceRequest({
      serviceTypeId: form.serviceTypeId,
      contact: { name: form.name, phone: form.phone, email: form.email || undefined },
      site: { town: form.town, area: form.area || undefined, details: form.details || undefined },
      description: form.description,
      preferredDate: form.preferredDate || undefined,
      photoIds: photos.map((p) => p.id),
    })
    setBusy(false)
    if (!res.ok) setError(res.error)
    else setRef(res.requestNumber)
  }

  if (ref) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-xl font-bold text-navy-900">Request {ref} received</h2>
        <p className="mt-3 text-slate-600">
          Our team will review it and get back to you with a quote, usually within one working day.
        </p>
        <p className="mt-1 text-sm text-slate-500">
          Create an account with the same email to track progress in your dashboard.
        </p>
        <Link href="/services" className="mt-6 inline-block rounded-lg bg-navy-900 text-white font-semibold px-5 py-2.5">
          Back to services
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <label className="text-sm font-medium text-navy-900">Service needed</label>
        <select className={`${input} mt-1`} value={form.serviceTypeId} onChange={(e) => set('serviceTypeId', e.target.value)} required>
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Full name" className={input} value={form.name} onChange={(e) => set('name', e.target.value)} />
        <input required placeholder="Phone (0712…)" className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
        <input type="email" placeholder="Email (recommended)" className={`${input} sm:col-span-2`} value={form.email} onChange={(e) => set('email', e.target.value)} />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <input required placeholder="Town / city" className={input} value={form.town} onChange={(e) => set('town', e.target.value)} />
        <input placeholder="Estate / building" className={input} value={form.area} onChange={(e) => set('area', e.target.value)} />
        <textarea placeholder="Directions / landmark" className={`${input} sm:col-span-2`} value={form.details} onChange={(e) => set('details', e.target.value)} />
      </div>

      <textarea
        required
        placeholder="Describe the work — e.g. 'Supply and install 4 CCTV cameras with night vision, cover the shopfront and store room.'"
        className={`${input} min-h-28`}
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
      />

      <div>
        <label className="text-sm font-medium text-navy-900">Preferred date (optional)</label>
        <input type="date" className={`${input} mt-1`} value={form.preferredDate} onChange={(e) => set('preferredDate', e.target.value)} />
      </div>

      <div>
        <label className="text-sm font-medium text-navy-900">Site photos (optional, up to 8)</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative h-16 w-16 rounded-lg border border-slate-200 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setPhotos((ps) => ps.filter((x) => x.id !== p.id))}
                className="absolute top-0 right-0 bg-black/60 text-white p-0.5"
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {photos.length < 8 && (
            <label className="h-16 w-16 rounded-lg border border-dashed border-slate-300 grid place-items-center cursor-pointer text-slate-400">
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              <input type="file" accept="image/*" multiple hidden onChange={(e) => onFiles(e.target.files)} />
            </label>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        disabled={busy || uploading}
        className="w-full rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold px-5 py-3 disabled:opacity-60"
      >
        {busy ? 'Submitting…' : 'Submit request'}
      </button>
    </form>
  )
}
