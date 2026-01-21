import type { UiLockState } from '@/src/lib/ui/types'

type ToolBadgesProps = {
  category: string
  aiLevel: 'none' | 'light' | 'heavy'
  lockState: UiLockState
}

const lockStyles: Record<UiLockState, { label: string; className: string }> = {
  available: {
    label: 'Available',
    className: 'bg-emerald-500/10 text-emerald-300',
  },
  trial: {
    label: 'Trial',
    className: 'bg-sky-500/10 text-sky-300',
  },
  limited: {
    label: 'Limited',
    className: 'bg-amber-500/10 text-amber-300',
  },
  locked: {
    label: 'Locked',
    className: 'bg-red-500/10 text-red-300',
  },
  disabled: {
    label: 'Disabled',
    className: 'bg-slate-500/10 text-slate-300',
  },
}

function formatAiLevel(aiLevel: ToolBadgesProps['aiLevel']) {
  if (aiLevel === 'none') return 'No AI'
  if (aiLevel === 'light') return 'Light AI'
  return 'Heavy AI'
}

export function ToolBadges({ category, aiLevel, lockState }: ToolBadgesProps) {
  const lock = lockStyles[lockState]

  return (
    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
      <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[hsl(var(--muted))]">
        {category}
      </span>

      <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[hsl(var(--muted))]">
        {formatAiLevel(aiLevel)}
      </span>

      <span className={`rounded-full px-2 py-0.5 ${lock.className}`}>
        {lock.label}
      </span>
    </div>
  )
}
