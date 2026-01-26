import { PLAN_CATALOG } from '@/src/lib/billing/planCatalog'
import { STRIPE_CATALOG } from '@/src/lib/billing/stripeCatalog'
import { TOKEN_PACKS } from '@/src/lib/billing/tokenPacks'

export type PlanSku = {
  id: string
  mode: 'subscription'
  planId: 'free' | 'pro_monthly' | 'team'
  stripePriceId?: string
  title: string
  subtitle: string
  priceDisplay: string
  billingInterval?: 'month'
  featured?: boolean
}

export type TokenPackSku = {
  id: string
  mode: 'payment'
  packId: string
  stripePriceId?: string
  title: string
  subtitle: string
  tokensGranted: number
}

const formatPrice = (price: number) => (price === 0 ? 'Free' : `$${price}`)

export const PLAN_SKUS: PlanSku[] = [
  {
    id: 'plan_free',
    mode: 'subscription',
    planId: 'free',
    title: PLAN_CATALOG.free.displayName,
    subtitle: 'Try the toolkit. Learn what works.',
    priceDisplay: formatPrice(PLAN_CATALOG.free.monthlyPrice),
  },
  {
    id: 'plan_pro_monthly',
    mode: 'subscription',
    planId: 'pro_monthly',
    title: PLAN_CATALOG.pro.displayName,
    subtitle: 'Unlimited momentum. Deeper outputs.',
    priceDisplay: formatPrice(PLAN_CATALOG.pro.monthlyPrice),
    billingInterval: 'month',
    featured: true,
    stripePriceId: STRIPE_CATALOG.plans.pro.priceId,
  },
  {
    id: 'plan_elite_monthly',
    mode: 'subscription',
    planId: 'team',
    title: PLAN_CATALOG.elite.displayName,
    subtitle: 'For serious operators.',
    priceDisplay: formatPrice(PLAN_CATALOG.elite.monthlyPrice),
    billingInterval: 'month',
    stripePriceId: STRIPE_CATALOG.plans.elite.priceId,
  },
]

export const TOKEN_PACK_SKUS: TokenPackSku[] = TOKEN_PACKS.map((pack) => ({
  id: `tokens_${pack.packId}`,
  mode: 'payment',
  packId: pack.packId,
  title: pack.displayName,
  subtitle: 'Bonus tokens never expire',
  tokensGranted: pack.tokensGranted,
  stripePriceId: pack.stripePriceId,
}))

export const PLAN_SKUS_BY_ID = Object.fromEntries(PLAN_SKUS.map((sku) => [sku.id, sku]))
export const TOKEN_PACK_SKUS_BY_ID = Object.fromEntries(TOKEN_PACK_SKUS.map((sku) => [sku.id, sku]))

export function getSku(skuId: string) {
  return PLAN_SKUS_BY_ID[skuId] || TOKEN_PACK_SKUS_BY_ID[skuId] || null
}

export function getSkuByPriceId(priceId: string) {
  const plan = PLAN_SKUS.find((sku) => sku.stripePriceId === priceId)
  if (plan) return plan
  const pack = TOKEN_PACK_SKUS.find((sku) => sku.stripePriceId === priceId)
  return pack || null
}
