export type StripePlanKey = 'pro' | 'elite'
export type StripeTokenPackKey = 'starter' | 'growth' | 'power'

export const STRIPE_CATALOG = {
  plans: {
    pro: {
      displayName: 'Pro',
      planId: 'pro_monthly',
      priceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
    },
    elite: {
      displayName: 'Elite',
      planId: 'team',
      priceId: process.env.STRIPE_PRICE_ID_ELITE_MONTHLY || '',
    },
  },
  tokenPacks: {
    starter: {
      packId: 'starter',
      displayName: 'Starter',
      priceId: process.env.STRIPE_PRICE_ID_TOKENS_STARTER || '',
      tokens: 2000,
      price: 9,
    },
    growth: {
      packId: 'growth',
      displayName: 'Growth',
      priceId: process.env.STRIPE_PRICE_ID_TOKENS_GROWTH || '',
      tokens: 6000,
      price: 19,
    },
    power: {
      packId: 'power',
      displayName: 'Power',
      priceId: process.env.STRIPE_PRICE_ID_TOKENS_POWER || '',
      tokens: 15000,
      price: 39,
    },
  },
} as const

export function getPlanByPriceId(priceId: string) {
  return Object.values(STRIPE_CATALOG.plans).find((plan) => plan.priceId === priceId) || null
}

export function getTokenPackByPriceId(priceId: string) {
  return Object.values(STRIPE_CATALOG.tokenPacks).find((pack) => pack.priceId === priceId) || null
}

export function getDisplayNameForPlanId(planId?: string | null) {
  if (planId === 'team') return 'Elite'
  if (planId === 'pro_monthly') return 'Pro'
  return 'Free'
}
