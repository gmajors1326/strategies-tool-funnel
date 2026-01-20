export type TokenPack = {
  packId: 'small' | 'medium' | 'large'
  stripePriceId: string
  tokensGranted: number
  displayName: string
  bonusPercent?: number
}

export const TOKEN_PACKS: TokenPack[] = [
  {
    packId: 'small',
    stripePriceId: process.env.STRIPE_TOKEN_PACK_SMALL_PRICE_ID || '',
    tokensGranted: 5000,
    displayName: 'Token Pack: Small',
  },
  {
    packId: 'medium',
    stripePriceId: process.env.STRIPE_TOKEN_PACK_MEDIUM_PRICE_ID || '',
    tokensGranted: 25000,
    displayName: 'Token Pack: Medium',
    bonusPercent: 10,
  },
  {
    packId: 'large',
    stripePriceId: process.env.STRIPE_TOKEN_PACK_LARGE_PRICE_ID || '',
    tokensGranted: 100000,
    displayName: 'Token Pack: Large',
    bonusPercent: 20,
  },
]

export const getTokenPackById = (packId: string) =>
  TOKEN_PACKS.find((pack) => pack.packId === packId)

export const getTokenPackByPriceId = (priceId: string) =>
  TOKEN_PACKS.find((pack) => pack.stripePriceId === priceId)
