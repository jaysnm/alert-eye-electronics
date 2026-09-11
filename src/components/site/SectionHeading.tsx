import Link from 'next/link'

export const SectionHeading = ({
  title,
  subtitle,
  href,
  linkLabel = 'View all',
}: {
  title: string
  subtitle?: string
  href?: string
  linkLabel?: string
}) => (
  <div className="flex items-end justify-between gap-4 mb-5">
    <div>
      <h2 className="text-xl sm:text-2xl font-bold text-navy-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
    </div>
    {href && (
      <Link href={href} className="text-sm font-semibold text-navy-500 hover:underline shrink-0">
        {linkLabel} →
      </Link>
    )}
  </div>
)
