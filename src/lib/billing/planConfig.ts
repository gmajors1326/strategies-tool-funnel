export type PlanKey = 'free' | 'pro' | 'business'

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
    tokensPerDay: 2000,
    heavyTools: false,
    orgs: false,
    title: 'Free',
    subtitle: 'Get started with core tools.',
    highlights: ['5 runs/day', '2,000 tokens/day', 'No heavy AI tools'],
  },
  pro: {
    price: 39,
    runsPerDay: 50,
    tokensPerDay: 25000,
    heavyTools: true,
    orgs: false,
    title: 'Pro',
    subtitle: 'For serious creators scaling output.',
    highlights: ['50 runs/day', '25,000 tokens/day', 'Heavy AI tools'],
  },
  business: {
    price: 129,
    runsPerDay: 200,
    tokensPerDay: 100000,
    heavyTools: true,
    orgs: true,
    title: 'Business',
    subtitle: 'For teams that need scale.',
    highlights: ['200 runs/day', '100,000 tokens/day', 'Org seats enabled'],
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
  if (planId === 'team') return 'business'
  if (planId === 'lifetime') return 'pro'
  return 'free'
}

export const getPlanKeyFromOrgPlan = (planId?: string | null): PlanKey | null => {
  if (planId === 'business') return 'business'
  return null
}
