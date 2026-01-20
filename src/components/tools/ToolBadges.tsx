import type { LockState } from '@/src/lib/tools/runTypes'

type ToolBadgesProps = {
  category: string
  aiLevel: 'none' | 'light' | 'heavy'
  lockState: LockState
}

const lockStyles: Record<LockState, string> = {
  ok: 'bg-emerald-500/10 text-emerald-300',
  locked_tokens: 'bg-red-500/10 text-red-300',
  locked_usage_daily: 'bg-red-500/10 text-red-300',
  locked_tool_daily: 'bg-red-500/10 text-red-300',
  locked_plan: 'bg-amber-500/10 text-amber-300',
  locked_trial: 'bg-amber-500/10 text-amber-300',
  locked_role: 'bg-slate-500/10 text-slate-300',
}

export function ToolBadges({ category, aiLevel, lockState }: ToolBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
      <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[hsl(var(--muted))]">
        {category}
      </span>
      <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[hsl(var(--muted))]">
        {aiLevel} ai
      </span>
      <span className={`rounded-full px-2 py-0.5 ${lockStyles[lockState]}`}>
        {lockState.replace('_', ' ')}
      </span>
    </div>
  )
}
import type { LockState } from '@/src/lib/tools/runTypes'

type ToolBadgesProps = {
  category: string
  aiLevel: 'none' | 'light' | 'heavy'
  lockState: LockState
}

const lockStyles: Record<LockState, string> = {
  ok: 'bg-emerald-500/10 text-emerald-300',
  locked_tokens: 'bg-red-500/10 text-red-300',
  locked_usage_daily: 'bg-red-500/10 text-red-300',
  locked_tool_daily: 'bg-red-500/10 text-red-300',
  locked_plan: 'bg-amber-500/10 text-amber-300',
  locked_trial: 'bg-amber-500/10 text-amber-300',
}

export function ToolBadges({ category, aiLevel, lockState }: ToolBadgesProps) {
  return (
    <div className="flex flex-wrap gap-2 text-[11px] uppercase tracking-wide">
      <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[hsl(var(--muted))]">
        {category}
      </span>
      <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5 text-[hsl(var(--muted))]">
        {aiLevel} ai
      </span>
      <span className={`rounded-full px-2 py-0.5 ${lockStyles[lockState]}`}>
        {lockState.replace('_', ' ')}
      </span>
    </div>
  )
}
