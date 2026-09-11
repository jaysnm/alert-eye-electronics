import {
  Truck,
  ShieldCheck,
  Headset,
  BadgeCheck,
  CreditCard,
  Wrench,
  Clock,
  type LucideIcon,
} from 'lucide-react'

const MAP: Record<string, LucideIcon> = {
  truck: Truck,
  shield: ShieldCheck,
  'badge-check': BadgeCheck,
  headset: Headset,
  'credit-card': CreditCard,
  wrench: Wrench,
  clock: Clock,
}

export const IconBadge = ({ name, size = 22 }: { name?: string | null; size?: number }) => {
  const Cmp = MAP[name ?? 'shield'] ?? ShieldCheck
  return <Cmp size={size} />
}
