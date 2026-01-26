export type PlanKey = 'free' | 'pro' | 'elite' | 'business'

export type PlanConfig = {
  price: number
  runsPerDay: number
  tokensPerDay: number
  heavyTools: boolean
  orgs: boolean
  title: string
  subtitle: string
  highlights: string[]
}

export const PLAN_CONFIG: Record<PlanKey, PlanConfig> = {
  free: {
    price: 0,
    runsPerDay: 5,
    tokensPerDay: 200,
    heavyTools: false,
    orgs: false,
    title: '7-Day Free Trial',
    subtitle: 'Try the core tools for 7 days.',
    highlights: ['5 runs/day', '200 tokens/day', '7-day access'],
  },
  pro: {
    price: 39,
    runsPerDay: 50,
    tokensPerDay: 2000,
    heavyTools: true,
    orgs: false,
    title: 'Pro',
    subtitle: 'For serious creators scaling output.',
    highlights: ['50 runs/day', '2,000 tokens/day', 'All 5 tools'],
  },
  elite: {
    price: 99,
    runsPerDay: 200,
    tokensPerDay: 6000,
    heavyTools: true,
    orgs: false,
    title: 'Elite',
    subtitle: 'For high-volume growth teams.',
    highlights: ['200 runs/day', '6,000 tokens/day', 'All exports'],
  },
  business: {
    price: 99,
    runsPerDay: 200,
    tokensPerDay: 6000,
    heavyTools: true,
    orgs: true,
    title: 'Elite',
    subtitle: 'For high-volume growth teams.',
    highlights: ['200 runs/day', '6,000 tokens/day', 'All exports'],
  },
}

export const getPlanCaps = (plan: PlanKey) => ({
  runsPerDay: PLAN_CONFIG[plan].runsPerDay,
  tokensPerDay: PLAN_CONFIG[plan].tokensPerDay,
  heavyTools: PLAN_CONFIG[plan].heavyTools,
  orgs: PLAN_CONFIG[plan].orgs,
})

export const getPlanPrice = (plan: PlanKey) => PLAN_CONFIG[plan].price

export const getPlanConfig = (plan: PlanKey) => PLAN_CONFIG[plan]

export const getPlanKeyFromEntitlement = (planId?: string): PlanKey => {
  if (planId === 'pro_monthly') return 'pro'
  if (planId === 'team') return 'elite'
  if (planId === 'lifetime') return 'pro'
  return 'free'
}

export const getPlanKeyFromOrgPlan = (planId?: string | null): PlanKey | null => {
  if (planId === 'business') return 'business'
  return null
}
