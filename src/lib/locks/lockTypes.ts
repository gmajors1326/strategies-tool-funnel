export type LockType = 'none' | 'tokens' | 'plan' | 'cooldown' | 'multi'

export type LockReason =
  | { type: 'none' }
  | { type: 'tokens'; tokensRemaining: number; resetAt: string }
  | { type: 'plan'; requiredPlanId: string }
  | { type: 'cooldown'; availableAt: string }
  | { type: 'multi'; reasons: Array<Exclude<LockReason, { type: 'none' }>> }

export type LockSeverity = 0 | 1 | 2 | 3

export const LOCK_SEVERITY: Record<LockType, LockSeverity> = {
  none: 0,
  cooldown: 1,
  tokens: 2,
  plan: 2,
  multi: 3,
}
