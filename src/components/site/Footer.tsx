import Link from 'next/link'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { AlertEyeMark } from '@/components/brand/AlertEyeLogo'

type Cat = { id: string | number; name: string; slug?: string | null }
type Settings = {
  phone?: string | null
  email?: string | null
  addressLine?: string | null
  hours?: string | null
  socials?: { platform?: string | null; url: string }[] | null
}

export const Footer = ({ settings, navCategories }: { settings: Settings; navCategories: Cat[] }) => (
  <footer className="mt-16 bg-navy-900 text-slate-200">
    <div className="container-page py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 p-1.5">
            <AlertEyeMark size={24} tone="light" />
          </span>
          <span className="font-bold text-white">Alert Eye Electronics</span>
        </div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)]">
          Always Alert, Always Watching
        </p>
        <p className="text-sm text-slate-300">
          Your trusted source for CCTV, security systems and electronics in Kenya — with professional
          installation and after-sales support.
        </p>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Shop</h3>
        <ul className="space-y-2 text-sm">
          <li>
            <Link href="/shop" className="hover:text-white">
              All products
            </Link>
          </li>
          {navCategories.slice(0, 6).map((c) => (
            <li key={c.id}>
              <Link href={`/shop/${c.slug}`} className="hover:text-white">
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Company</h3>
        <ul className="space-y-2 text-sm">
          <li><Link href="/services" className="hover:text-white">Services</Link></li>
          <li><Link href="/services/request" className="hover:text-white">Request installation</Link></li>
          <li><Link href="/about" className="hover:text-white">About us</Link></li>
          <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
          <li><Link href="/delivery-returns" className="hover:text-white">Delivery &amp; returns</Link></li>
          <li><Link href="/warranty" className="hover:text-white">Warranty</Link></li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-3">Get in touch</h3>
        <ul className="space-y-2 text-sm">
          {settings.addressLine && (
            <li className="flex gap-2"><MapPin size={16} className="mt-0.5 shrink-0" /> {settings.addressLine}</li>
          )}
          {settings.phone && (
            <li className="flex gap-2"><Phone size={16} className="mt-0.5 shrink-0" /> <a href={`tel:${settings.phone}`}>{settings.phone}</a></li>
          )}
          {settings.email && (
            <li className="flex gap-2"><Mail size={16} className="mt-0.5 shrink-0" /> <a href={`mailto:${settings.email}`}>{settings.email}</a></li>
          )}
          {settings.hours && (
            <li className="flex gap-2"><Clock size={16} className="mt-0.5 shrink-0" /> {settings.hours}</li>
          )}
        </ul>
        {settings.socials && settings.socials.length > 0 && (
          <div className="flex gap-3 mt-4 text-sm">
            {settings.socials.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" className="capitalize hover:text-white">
                {s.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
    <div className="border-t border-white/10">
      <div className="container-page py-4 text-xs text-slate-400 flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} Alert Eye Electronics. All rights reserved.</span>
        <span>Nairobi, Kenya</span>
      </div>
    </div>
  </footer>
)
