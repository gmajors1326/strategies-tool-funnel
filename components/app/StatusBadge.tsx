import type { ToolAccessStatus } from '@/src/lib/usage/limits'
import { cn } from '@/lib/utils'

type StatusBadgeProps = {
  status: ToolAccessStatus
  label?: string
}

const STATUS_MAP: Record<ToolAccessStatus, { label: string; className: string }> = {
  available: { label: 'Available', className: 'bg-emerald-500/10 text-emerald-300' },
  locked_plan: { label: 'Plan Locked', className: 'bg-amber-500/10 text-amber-300' },
  locked_purchase: { label: 'Upgrade Needed', className: 'bg-amber-500/10 text-amber-300' },
  locked_usage_daily: { label: 'Daily Limit', className: 'bg-red-500/10 text-red-300' },
  locked_tokens: { label: 'Token Locked', className: 'bg-red-500/10 text-red-300' },
  disabled: { label: 'Disabled', className: 'bg-slate-500/10 text-slate-300' },
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = STATUS_MAP[status]
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide',
        config.className
      )}
    >
      {label ?? config.label}
    </span>
  )
}
