import type { UiConfig } from '@/src/lib/ui/types'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

type TopUsageBarProps = {
  usage: UiConfig['usage']
}

const getCountdown = (resetsAtISO: string) => {
  const ms = new Date(resetsAtISO).getTime() - Date.now()
  if (ms <= 0) return 'Resetting now'
  const hours = Math.floor(ms / 1000 / 60 / 60)
  const minutes = Math.floor((ms / 1000 / 60) % 60)
  return `${hours}h ${minutes}m`
}

export function TopUsageBar({ usage }: TopUsageBarProps) {
  const runPct = Math.min((usage.dailyRunsUsed / usage.dailyRunCap) * 100, 100)
  const tokenPct = Math.min((usage.aiTokensUsed / usage.aiTokenCap) * 100, 100)
  const resetCountdown = getCountdown(usage.resetsAtISO)
  const showBuyTokens = usage.tokensRemaining <= 0 || tokenPct >= 90

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">Daily Runs</p>
          <p className="text-sm">{usage.dailyRunsUsed} / {usage.dailyRunCap}</p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">Daily Tokens</p>
          <p className="text-sm">{usage.aiTokensUsed} / {usage.aiTokenCap}</p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">Tokens Remaining</p>
          <p className="text-sm">{usage.tokensRemaining}</p>
        </div>
        <div>
          <p className="text-xs text-[hsl(var(--muted))]">Reset In</p>
          <p className="text-sm">{resetCountdown}</p>
        </div>
        {showBuyTokens && (
          <Link href="/pricing">
            <Button>Buy tokens</Button>
          </Link>
        )}
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
