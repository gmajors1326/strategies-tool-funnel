import { STRIPE_CATALOG } from '@/src/lib/billing/stripeCatalog'

export type PlanPrice = {
  planId: 'pro' | 'elite'
  stripePriceId: string
  displayName: string
}

export const PLAN_PRICES: PlanPrice[] = [
  {
    planId: 'pro',
    stripePriceId: STRIPE_CATALOG.plans.pro.priceId,
    displayName: 'Pro Plan',
  },
  {
    planId: 'elite',
    stripePriceId: STRIPE_CATALOG.plans.elite.priceId,
    displayName: 'Elite Plan',
  },
]

export const getPlanById = (planId: string) =>
  PLAN_PRICES.find((plan) => plan.planId === planId)

export const getPlanByPriceId = (priceId: string) =>
  PLAN_PRICES.find((plan) => plan.stripePriceId === priceId)
