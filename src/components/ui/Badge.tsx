import { cn } from '@/lib/utils'

type BadgeProps = {
  label: string
  variant?: 'default' | 'featured'
}

export function Badge({ label, variant = 'default' }: BadgeProps) {
  const variants = {
    default: 'border border-[hsl(var(--border))] text-[hsl(var(--muted))]',
    featured: 'border border-red-500/40 text-red-200',
  }

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide', variants[variant])}>
      {label}
    </span>
  )
}
