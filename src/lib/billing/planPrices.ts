export type PlanPrice = {
  planId: 'pro' | 'business'
  stripePriceId: string
  displayName: string
}

export const PLAN_PRICES: PlanPrice[] = [
  {
    planId: 'pro',
    stripePriceId: process.env.STRIPE_PLAN_PRO_PRICE_ID || '',
    displayName: 'Pro Plan',
  },
  {
    planId: 'business',
    stripePriceId: process.env.STRIPE_PLAN_BUSINESS_PRICE_ID || '',
    displayName: 'Business Plan',
  },
]

export const getPlanById = (planId: string) =>
  PLAN_PRICES.find((plan) => plan.planId === planId)

export const getPlanByPriceId = (priceId: string) =>
  PLAN_PRICES.find((plan) => plan.stripePriceId === priceId)
