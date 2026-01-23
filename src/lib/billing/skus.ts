import { PLAN_CONFIG } from '@/src/lib/billing/planConfig'
import { TOKEN_PACKS } from '@/src/lib/billing/tokenPacks'

export type PlanSku = {
  id: string
  mode: 'subscription' | 'payment'
  planId: 'free' | 'pro_monthly' | 'team' | 'lifetime'
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
    title: 'Free',
    subtitle: 'Try the toolkit. Learn what works.',
    priceDisplay: formatPrice(PLAN_CONFIG.free.price),
  },
  {
    id: 'plan_pro_monthly',
    mode: 'subscription',
    planId: 'pro_monthly',
    title: 'Pro',
    subtitle: 'Unlimited momentum. Deeper outputs.',
    priceDisplay: formatPrice(PLAN_CONFIG.pro.price),
    billingInterval: 'month',
    featured: true,
    stripePriceId:
      process.env.STRIPE_PRICE_ID_PRO_MONTHLY || process.env.STRIPE_PLAN_PRO_PRICE_ID || '',
  },
  {
    id: 'plan_team_monthly',
    mode: 'subscription',
    planId: 'team',
    title: 'Team',
    subtitle: 'For serious operators.',
    priceDisplay: formatPrice(PLAN_CONFIG.business.price),
    billingInterval: 'month',
    stripePriceId:
      process.env.STRIPE_PRICE_ID_TEAM_MONTHLY || process.env.STRIPE_PLAN_BUSINESS_PRICE_ID || '',
  },
  {
    id: 'plan_lifetime',
    mode: 'payment',
    planId: 'lifetime',
    title: 'Lifetime',
    subtitle: 'Pay once. Unlock forever.',
    priceDisplay: '$799',
    stripePriceId: process.env.STRIPE_PRICE_ID_LIFETIME || '',
  },
]

export const TOKEN_PACK_SKUS: TokenPackSku[] = TOKEN_PACKS.map((pack) => ({
  id: `tokens_${pack.packId}`,
  mode: 'payment',
  packId: pack.packId,
  title: pack.displayName,
  subtitle: pack.bonusPercent ? `${pack.bonusPercent}% bonus tokens` : 'Best for occasional spikes',
  tokensGranted: pack.tokensGranted,
  stripePriceId:
    pack.packId === 'small'
      ? process.env.STRIPE_PRICE_ID_TOKENS_SMALL || process.env.STRIPE_TOKEN_PACK_SMALL_PRICE_ID || ''
      : pack.packId === 'medium'
        ? process.env.STRIPE_PRICE_ID_TOKENS_MEDIUM || process.env.STRIPE_TOKEN_PACK_MEDIUM_PRICE_ID || ''
        : process.env.STRIPE_PRICE_ID_TOKENS_LARGE || process.env.STRIPE_TOKEN_PACK_LARGE_PRICE_ID || '',
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
