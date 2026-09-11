import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <p className="text-6xl font-extrabold text-navy-900">404</p>
      <p className="mt-3 text-slate-600">We couldn&apos;t find that page.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-navy-900 text-white font-semibold px-5 py-2.5">
        Back to home
      </Link>
    </div>
  )
}
