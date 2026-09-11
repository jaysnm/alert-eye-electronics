'use client'

import { useState } from 'react'
import type { ServiceRequest, ServiceType } from '@/payload-types'
import { formatKES } from '@/lib/format'
import { acceptQuote } from '@/actions/quote'

const STEPS = ['new', 'quoted', 'scheduled', 'in_progress', 'completed'] as const
const LABEL: Record<string, string> = {
  new: 'Received',
  quoted: 'Quoted',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const StatusBar = ({ status }: { status: string }) => {
  if (status === 'cancelled') return <p className="text-sm font-medium text-red-600">Cancelled</p>
  const idx = STEPS.indexOf(status as never)
  return (
    <div className="flex items-center gap-1">
      {STEPS.map((s, i) => (
        <div key={s} className="flex-1">
          <div className={`h-1.5 rounded-full ${i <= idx ? 'bg-navy-900' : 'bg-slate-200'}`} />
          <span className={`mt-1 block text-[10px] ${i <= idx ? 'text-navy-900 font-medium' : 'text-slate-400'}`}>
            {LABEL[s]}
          </span>
        </div>
      ))}
    </div>
  )
}

const QuoteBox = ({ request }: { request: ServiceRequest }) => {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const q = request.quote
  if (!q) return null

  const accept = async (withDeposit: boolean) => {
    setBusy(true)
    setMsg(null)
    const res = await acceptQuote(String(request.requestNumber), withDeposit)
    setBusy(false)
    if (!res.ok) return setMsg(res.error)
    if (res.redirectUrl) {
      window.location.href = res.redirectUrl
      return
    }
    setMsg('Quote accepted. We will confirm your booking shortly.')
  }

  return (
    <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
      <p className="font-semibold text-navy-900">Quote: {formatKES(q.totalKES ?? 0)}</p>
      {(q.lineItems ?? []).map((li) => (
        <div key={li.id} className="flex justify-between text-slate-600">
          <span>{li.qty} × {li.label}</span>
          <span>{formatKES((li.qty ?? 0) * (li.unitPriceKES ?? 0))}</span>
        </div>
      ))}
      {q.labourKES ? (
        <div className="flex justify-between text-slate-600">
          <span>Labour</span>
          <span>{formatKES(q.labourKES)}</span>
        </div>
      ) : null}
      {q.depositKES ? <p className="text-xs text-slate-500 mt-1">Deposit to book: {formatKES(q.depositKES)}</p> : null}

      {request.status === 'quoted' && !q.acceptedAt && (
        <div className="mt-3 flex flex-wrap gap-2">
          {q.depositKES ? (
            <button disabled={busy} onClick={() => accept(true)} className="rounded-lg bg-navy-900 text-white font-semibold px-4 py-2 text-xs disabled:opacity-60">
              Accept &amp; pay deposit
            </button>
          ) : null}
          <button disabled={busy} onClick={() => accept(false)} className="rounded-lg border border-navy-900 text-navy-900 font-semibold px-4 py-2 text-xs disabled:opacity-60">
            Accept quote
          </button>
        </div>
      )}
      {q.acceptedAt && <p className="mt-2 text-xs text-green-700 font-medium">Accepted ✓</p>}
      {msg && <p className="mt-2 text-xs text-slate-600">{msg}</p>}
    </div>
  )
}

export const ServiceRequestList = ({ requests }: { requests: ServiceRequest[] }) => {
  if (requests.length === 0)
    return <p className="text-sm text-slate-500">No service requests yet.</p>

  return (
    <div className="space-y-4">
      {requests.map((r) => {
        const service = r.serviceType as ServiceType | number
        return (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-navy-900">
                  {typeof service === 'object' ? service.name : 'Service'}
                </p>
                <p className="text-xs text-slate-500">
                  {r.requestNumber} · {new Date(r.createdAt).toLocaleDateString('en-KE')}
                </p>
              </div>
              {r.scheduledStart && (
                <span className="text-xs text-navy-700 font-medium text-right">
                  {new Date(r.scheduledStart).toLocaleString('en-KE')}
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600 line-clamp-2">{r.description}</p>
            <div className="mt-4">
              <StatusBar status={r.status ?? 'new'} />
            </div>
            <QuoteBox request={r} />
          </div>
        )
      })}
    </div>
  )
}
