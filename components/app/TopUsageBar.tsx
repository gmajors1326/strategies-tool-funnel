import Link from 'next/link'
import type { UiConfig } from '@/src/lib/mock/data'

type TopUsageBarProps = {
  usage: UiConfig['usage']
}

export function TopUsageBar({ usage }: TopUsageBarProps) {
  const runPct = Math.min((usage.dailyRunsUsed / usage.dailyRunCap) * 100, 100)
  const tokenPct = Math.min((usage.aiTokensUsed / usage.aiTokenCap) * 100, 100)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">Daily Runs</p>
          <p className="text-sm text-[hsl(var(--text))]">
            {usage.dailyRunsUsed} / {usage.dailyRunCap}
          </p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">AI Tokens</p>
          <p className="text-sm text-[hsl(var(--text))]">
            {usage.aiTokensUsed} / {usage.aiTokenCap}
          </p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">Purchased Tokens</p>
          <p className="text-sm text-[hsl(var(--text))]">{usage.purchasedTokensRemaining}</p>
        </div>
        <Link href="/app/usage" className="text-xs text-red-300 hover:text-red-200">
          Buy Tokens
        </Link>
      </div>
      <div className="space-y-2">
        <div>
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
            <span>Runs</span>
            <span>{runPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--surface-3))]">
            <div className="h-2 rounded-full bg-red-500" style={{ width: `${runPct}%` }} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
            <span>Tokens</span>
            <span>{tokenPct.toFixed(0)}%</span>
          </div>
          <div className="h-2 rounded-full bg-[hsl(var(--surface-3))]">
            <div className="h-2 rounded-full bg-red-500" style={{ width: `${tokenPct}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}
