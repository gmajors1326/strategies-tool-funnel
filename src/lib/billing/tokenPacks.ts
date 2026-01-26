import { STRIPE_CATALOG } from '@/src/lib/billing/stripeCatalog'

export type TokenPack = {
  packId: 'starter' | 'growth' | 'power'
  stripePriceId: string
  tokensGranted: number
  displayName: string
  bonusPercent?: number
}

export const TOKEN_PACKS: TokenPack[] = [
  {
    packId: 'starter',
    stripePriceId: STRIPE_CATALOG.tokenPacks.starter.priceId,
    tokensGranted: STRIPE_CATALOG.tokenPacks.starter.tokens,
    displayName: 'Starter',
  },
  {
    packId: 'growth',
    stripePriceId: STRIPE_CATALOG.tokenPacks.growth.priceId,
    tokensGranted: STRIPE_CATALOG.tokenPacks.growth.tokens,
    displayName: 'Growth',
  },
  {
    packId: 'power',
    stripePriceId: STRIPE_CATALOG.tokenPacks.power.priceId,
    tokensGranted: STRIPE_CATALOG.tokenPacks.power.tokens,
    displayName: 'Power',
  },
]

export const getTokenPackById = (packId: string) =>
  TOKEN_PACKS.find((pack) => pack.packId === packId)

export const getTokenPackByPriceId = (priceId: string) =>
  TOKEN_PACKS.find((pack) => pack.stripePriceId === priceId)
