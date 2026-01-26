export type PlanId = 'free' | 'pro_monthly' | 'lifetime' | 'team'

export type PlanConfig = {
  id: PlanId
  name: string
  dailyRunCap: number
  dailyAiTokenCap: number
  allowTokenOverage: boolean
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: '7-Day Free Trial',
    dailyRunCap: 3,
    dailyAiTokenCap: 2000,
    allowTokenOverage: false,
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    dailyRunCap: 25,
    dailyAiTokenCap: 20000,
    allowTokenOverage: true,
  },
  lifetime: {
    id: 'lifetime',
    name: 'Lifetime',
    dailyRunCap: 50,
    dailyAiTokenCap: 40000,
    allowTokenOverage: true,
  },
  team: {
    id: 'team',
    name: 'Team',
    dailyRunCap: 100,
    dailyAiTokenCap: 80000,
    allowTokenOverage: true,
  },
}

export const getPlanConfig = (planId: PlanId): PlanConfig => {
  return PLAN_CONFIGS[planId] ?? PLAN_CONFIGS.free
}
