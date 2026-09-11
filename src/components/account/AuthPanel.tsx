'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginCustomer, registerCustomer } from '@/actions/auth'

const input = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-navy-500'

export const AuthPanel = () => {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res =
      mode === 'login'
        ? await loginCustomer(form.email, form.password)
        : await registerCustomer(form)
    setBusy(false)
    if (res.ok) router.refresh()
    else setError(res.error)
  }

  return (
    <div className="max-w-md mx-auto rounded-xl border border-slate-200 bg-white p-6">
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'login' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Sign in
        </button>
        <button
          onClick={() => setMode('register')}
          className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === 'register' ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600'}`}
        >
          Create account
        </button>
      </div>

      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && (
          <>
            <input required placeholder="Full name" className={input} value={form.name} onChange={(e) => set('name', e.target.value)} />
            <input required placeholder="Phone (0712…)" className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </>
        )}
        <input required type="email" placeholder="Email" className={input} value={form.email} onChange={(e) => set('email', e.target.value)} />
        <input required type="password" placeholder="Password" className={input} value={form.password} onChange={(e) => set('password', e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-[color:var(--accent)] text-navy-900 font-semibold py-2.5 disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </button>
      </form>
    </div>
  )
}
