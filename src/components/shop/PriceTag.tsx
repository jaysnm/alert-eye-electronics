import { formatKES, discountPct } from '@/lib/format'
import { cn } from '@/lib/utils'

export const PriceTag = ({
  price,
  compareAt,
  size = 'md',
}: {
  price: number
  compareAt?: number | null
  size?: 'sm' | 'md' | 'lg'
}) => {
  const pct = discountPct(price, compareAt)
  return (
    <div className="flex items-baseline gap-2 flex-wrap">
      <span
        className={cn(
          'font-bold text-navy-900',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-lg',
          size === 'lg' && 'text-2xl',
        )}
      >
        {formatKES(price)}
      </span>
      {pct && (
        <>
          <span className="text-slate-400 line-through text-sm">{formatKES(compareAt!)}</span>
          <span className="text-[11px] font-bold text-white bg-[color:var(--accent)] rounded px-1.5 py-0.5">
            -{pct}%
          </span>
        </>
      )}
    </div>
  )
}
