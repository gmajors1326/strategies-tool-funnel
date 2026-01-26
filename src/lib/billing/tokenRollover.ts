import { DAILY_TOKENS, type PlanTier } from './tokenEconomy'

type RolloverPolicy = {
  enabled: boolean
  cap: number
  capDays: number
}

export const ROLLOVER_POLICY: Record<PlanTier, RolloverPolicy> = {
  free: { enabled: false, cap: 0, capDays: 0 },
  pro: { enabled: true, cap: DAILY_TOKENS.pro * 7, capDays: 7 },
  elite: { enabled: true, cap: DAILY_TOKENS.elite * 30, capDays: 30 },
}

export function getRolloverPolicy(tier: PlanTier) {
  return ROLLOVER_POLICY[tier]
}

export function getRolloverCap(tier: PlanTier) {
  return ROLLOVER_POLICY[tier].cap
}
