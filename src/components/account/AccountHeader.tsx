'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { logoutCustomer } from '@/actions/auth'

export const AccountHeader = ({ name, email }: { name: string; email: string }) => {
  const router = useRouter()
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5">
      <div>
        <h1 className="text-xl font-bold text-navy-900">Hi {name.split(' ')[0]}</h1>
        <p className="text-sm text-slate-500">{email}</p>
      </div>
      <button
        onClick={async () => {
          await logoutCustomer()
          router.refresh()
        }}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-navy-900"
      >
        <LogOut size={16} /> Sign out
      </button>
    </div>
  )
}
