'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, ShoppingCart, Menu, X, User, Phone } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { cn } from '@/lib/utils'
import { AlertEyeMark } from '@/components/brand/AlertEyeLogo'

type Cat = { id: string | number; name: string; slug?: string | null }
type Settings = { phone?: string | null }

export const Header = ({ settings, navCategories }: { settings: Settings; navCategories: Cat[] }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [q, setQ] = useState('')
  const router = useRouter()
  const count = useCart((s) => s.count())

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop')
    setMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm">
      <div className="container-page">
        <div className="flex items-center gap-3 py-3">
          <button
            className="lg:hidden p-2 -ml-2"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="Alert Eye Electronics — Always Alert, Always Watching">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 p-1.5">
              <AlertEyeMark size={24} tone="light" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-bold leading-tight text-navy-900">
                Alert Eye<span className="hidden sm:inline"> Electronics</span>
              </span>
              <span className="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)]">
                Always Alert, Always Watching
              </span>
            </span>
          </Link>

          <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-xl mx-2">
            <div className="flex w-full rounded-lg border border-slate-300 overflow-hidden focus-within:border-navy-500">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cameras, laptops, tools…"
                className="w-full px-3 py-2 text-sm outline-none"
              />
              <button className="px-4 bg-navy-900 text-white" aria-label="Search">
                <Search size={18} />
              </button>
            </div>
          </form>

          <div className="ml-auto flex items-center gap-1">
            {settings.phone && (
              <a
                href={`tel:${settings.phone}`}
                className="hidden xl:flex items-center gap-1 text-sm text-slate-600 px-3"
              >
                <Phone size={16} /> {settings.phone}
              </a>
            )}
            <Link href="/account" className="p-2 text-slate-700 hover:text-navy-900" aria-label="Account">
              <User size={22} />
            </Link>
            <Link href="/cart" className="relative p-2 text-slate-700 hover:text-navy-900" aria-label="Cart">
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 rounded-full bg-[color:var(--accent)] text-navy-900 text-[11px] font-bold flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>

        <form onSubmit={submitSearch} className="md:hidden pb-3">
          <div className="flex w-full rounded-lg border border-slate-300 overflow-hidden">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              className="w-full px-3 py-2 text-sm outline-none"
            />
            <button className="px-4 bg-navy-900 text-white" aria-label="Search">
              <Search size={18} />
            </button>
          </div>
        </form>

        <nav className="hidden lg:flex items-center gap-1 border-t border-slate-100 py-2 text-sm">
          <Link href="/shop" className="px-3 py-1.5 font-semibold text-navy-900 hover:bg-slate-50 rounded">
            All Products
          </Link>
          {navCategories.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              className="px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/services" className="px-3 py-1.5 text-slate-700 hover:bg-slate-50 rounded">
            Services
          </Link>
          <Link
            href="/services/request"
            className="ml-auto px-3 py-1.5 rounded bg-[color:var(--accent)] text-navy-900 font-semibold"
          >
            Request CCTV Installation
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden border-t border-slate-100 bg-white overflow-hidden transition-[max-height]',
          menuOpen ? 'max-h-[80vh]' : 'max-h-0',
        )}
      >
        <div className="container-page py-3 flex flex-col">
          <Link href="/shop" onClick={() => setMenuOpen(false)} className="py-2 font-semibold text-navy-900">
            All Products
          </Link>
          {navCategories.map((c) => (
            <Link
              key={c.id}
              href={`/shop/${c.slug}`}
              onClick={() => setMenuOpen(false)}
              className="py-2 text-slate-700"
            >
              {c.name}
            </Link>
          ))}
          <Link href="/services" onClick={() => setMenuOpen(false)} className="py-2 text-slate-700">
            Services
          </Link>
          <Link
            href="/services/request"
            onClick={() => setMenuOpen(false)}
            className="mt-2 py-2 text-center rounded bg-[color:var(--accent)] text-navy-900 font-semibold"
          >
            Request CCTV Installation
          </Link>
        </div>
      </div>
    </header>
  )
}
