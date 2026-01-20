import type { RunLock } from '@/src/lib/tools/runTypes'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'

type RunErrorPanelProps = {
  lock?: RunLock | null
  error?: { message: string } | null
}

export function RunErrorPanel({ lock, error }: RunErrorPanelProps) {
  if (!lock && !error) return null

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-2">
        <p className="text-sm font-semibold">{error.message}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 space-y-2">
      <p className="text-sm font-semibold">{lock?.message}</p>
      {lock?.usage && (
        <p className="text-xs text-red-200">
          Runs: {lock.usage.runsUsed}/{lock.usage.runsCap} · Tokens: {lock.usage.aiTokensUsed}/{lock.usage.aiTokensCap}
        </p>
      )}
      {lock?.cta?.href && (
        <Link href={lock.cta.href}>
          <Button>{lock.cta.type === 'wait_reset' ? 'Wait for reset' : 'Continue'}</Button>
        </Link>
      )}
    </div>
  )
}
