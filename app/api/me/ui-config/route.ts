import { NextResponse } from 'next/server'
import { buildUiConfig } from '@/src/lib/ui/resolveUiConfig'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'

export const dynamic = 'force-dynamic'

type LockStatus = 'unlocked' | 'locked_tokens' | 'locked_plan' | 'locked_time'

function mapLockStatus(lockState: string, reason?: string): LockStatus {
  if (lockState === 'available' || lockState === 'trial') return 'unlocked'
  if (lockState === 'limited') return 'locked_time'

  const reasonText = (reason ?? '').toLowerCase()
  if (reasonText.includes('token')) return 'locked_tokens'
  return 'locked_plan'
}

function computeWorstLock(locks: Record<string, { status: LockStatus }>) {
  const values = Object.values(locks)
  if (!values.length) return undefined
  if (values.some((l) => l.status === 'locked_tokens')) return { status: 'locked_tokens' as const }
  if (values.some((l) => l.status === 'locked_plan')) return { status: 'locked_plan' as const }
  if (values.some((l) => l.status === 'locked_time')) return { status: 'locked_time' as const }
  return { status: 'unlocked' as const }
}

export async function GET() {
  const ui = await buildUiConfig()
  const entitlements = getEntitlements({ id: ui.user.id, planId: ui.user.planId })

  const tokens = {
    balance: ui.usage.tokensRemaining,
    dailyUsed: ui.usage.aiTokensUsed,
    dailyCap: ui.usage.aiTokenCap,
    resetsAtISO: ui.usage.resetsAtISO,
  }

  const catalog = ui.catalogTools ?? ui.catalog ?? []
  const locks = Object.fromEntries(
    catalog.map((tool) => [
      tool.id,
      {
        status: mapLockStatus(tool.lockState, tool.reason),
        reason: tool.reason,
        resetAt: tool.lockState === 'limited' ? ui.usage.resetsAtISO : undefined,
      },
    ])
  )

  const worstLock = computeWorstLock(locks)

  return NextResponse.json({
    ...ui,
    entitlements,
    tokens,
    locks,
    worstLock,
  })
}
