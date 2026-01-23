import type { ToolMeta, PlanId } from '@/src/lib/tools/registry'
import type { LockReason } from '@/src/lib/locks/lockTypes'
import { LOCK_SEVERITY } from '@/src/lib/locks/lockTypes'

type UsageSnapshot = {
  tokensRemaining: number
  resetAt?: string
  runsUsed?: number
  runsCap?: number
  perToolRunsUsed?: Record<string, number>
  toolRunsCap?: number
}

type CooldownInfo = { availableAt?: string }

type ComputeParams = {
  toolMeta: ToolMeta
  userPlanId: PlanId
  usage: UsageSnapshot
  cooldownInfo?: CooldownInfo | null
}

const PLAN_ORDER: PlanId[] = ['free', 'pro_monthly', 'team', 'lifetime']

function getRequiredPlanId(tool: ToolMeta): PlanId {
  const firstPaid = PLAN_ORDER.find((plan) => plan !== 'free' && tool.planEntitlements?.[plan])
  return firstPaid || 'pro_monthly'
}

export function computeToolLock(params: ComputeParams): LockReason {
  const { toolMeta, userPlanId, usage, cooldownInfo } = params
  const reasons: Array<Exclude<LockReason, { type: 'none' }>> = []

  if (usage.tokensRemaining <= 0) {
    reasons.push({
      type: 'tokens',
      tokensRemaining: usage.tokensRemaining,
      resetAt: usage.resetAt || '',
    })
  }

  if (!toolMeta.planEntitlements?.[userPlanId]) {
    reasons.push({ type: 'plan', requiredPlanId: getRequiredPlanId(toolMeta) })
  }

  const availableAt = cooldownInfo?.availableAt
  if (availableAt && Date.now() < new Date(availableAt).getTime()) {
    reasons.push({ type: 'cooldown', availableAt })
  }

  if (reasons.length === 0) return { type: 'none' }
  if (reasons.length === 1) return reasons[0]
  return { type: 'multi', reasons }
}

export function getWorstLock(locks: LockReason[]): LockReason {
  if (!locks.length) return { type: 'none' }
  const multi = locks.find((l) => l.type === 'multi')
  if (multi) return multi

  const weight = (lock: LockReason) => {
    if (lock.type === 'tokens') return 30
    if (lock.type === 'plan') return 20
    if (lock.type === 'cooldown') return 10
    return 0
  }

  return locks.reduce((worst, current) => {
    const worstSeverity = LOCK_SEVERITY[worst.type]
    const currentSeverity = LOCK_SEVERITY[current.type]
    if (currentSeverity > worstSeverity) return current
    if (currentSeverity < worstSeverity) return worst
    return weight(current) > weight(worst) ? current : worst
  }, locks[0])
}

export function getLockResetAt(lock: LockReason): string | null {
  if (lock.type === 'tokens') return lock.resetAt || null
  if (lock.type === 'cooldown') return lock.availableAt || null
  if (lock.type !== 'multi') return null

  const token = lock.reasons.find((r) => r.type === 'tokens')
  if (token?.type === 'tokens' && token.resetAt) return token.resetAt

  const timeBased = lock.reasons
    .map((r) => (r.type === 'cooldown' ? r.availableAt : null))
    .filter(Boolean)
    .map((iso) => new Date(iso as string).getTime())

  if (!timeBased.length) return null
  return new Date(Math.min(...timeBased)).toISOString()
}
