export type SkuType = 'subscription' | 'lifetime' | 'tool' | 'token_pack' | 'bundle'
export type TrialMode = 'sandbox' | 'live' | 'preview'

export type Sku = {
  id: string
  type: SkuType
  title: string
  subtitle?: string
  priceDisplay: string
  billingInterval?: 'month' | 'year' | null
  tokensGranted?: number
  featured?: boolean
  ctaLabel?: string
  entitlements?: {
    planId?: 'free' | 'pro_monthly' | 'team' | 'lifetime'
    tools?: string[]
    seats?: number
  }
  toolId?: string
  trial?: { enabled: boolean; oneTimePerTool: boolean; mode: TrialMode }
}

export const SKU_REGISTRY: Sku[] = [
  {
    id: 'plan_free',
    type: 'subscription',
    title: 'Free',
    subtitle: 'Get started with core tools.',
    priceDisplay: 'Free',
    billingInterval: null,
    ctaLabel: 'Get started',
    entitlements: { planId: 'free' },
  },
  {
    id: 'plan_pro_monthly',
    type: 'subscription',
    title: 'Pro',
    subtitle: 'Unlock higher daily tokens.',
    priceDisplay: '$39',
    billingInterval: 'month',
    ctaLabel: 'Upgrade',
    entitlements: { planId: 'pro_monthly' },
  },
  {
    id: 'plan_team_monthly',
    type: 'subscription',
    title: 'Elite',
    subtitle: 'Maximum tokens and exports.',
    priceDisplay: '$99',
    billingInterval: 'month',
    ctaLabel: 'Upgrade',
    entitlements: { planId: 'team', seats: 5 },
  },
  {
    id: 'tokens_starter',
    type: 'token_pack',
    title: 'Starter Tokens',
    subtitle: 'Bonus tokens never expire.',
    priceDisplay: '$9',
    tokensGranted: 2000,
    ctaLabel: 'Buy tokens',
  },
  {
    id: 'tokens_growth',
    type: 'token_pack',
    title: 'Growth Tokens',
    subtitle: 'Bonus tokens never expire.',
    priceDisplay: '$19',
    tokensGranted: 6000,
    featured: true,
    ctaLabel: 'Buy tokens',
  },
  {
    id: 'tokens_power',
    type: 'token_pack',
    title: 'Power Tokens',
    subtitle: 'Bonus tokens never expire.',
    priceDisplay: '$39',
    tokensGranted: 15000,
    ctaLabel: 'Buy tokens',
  },
  {
    id: 'tool_hook_analyzer',
    type: 'tool',
    title: 'Hook Analyzer',
    subtitle: 'Diagnose hooks before you publish.',
    priceDisplay: '$29',
    toolId: 'hook-analyzer',
    ctaLabel: 'Buy tool',
    entitlements: { tools: ['hook-analyzer'] },
    trial: { enabled: true, oneTimePerTool: true, mode: 'sandbox' },
  },
  {
    id: 'tool_analytics_signal_reader',
    type: 'tool',
    title: 'Analytics Signal Reader',
    subtitle: 'Turn metrics into next actions.',
    priceDisplay: '$39',
    toolId: 'analytics-signal-reader',
    ctaLabel: 'Buy tool',
    entitlements: { tools: ['analytics-signal-reader'] },
    trial: { enabled: true, oneTimePerTool: true, mode: 'preview' },
  },
  {
    id: 'tool_retention_leak_finder',
    type: 'tool',
    title: 'Retention Leak Finder',
    subtitle: 'Patch the drop-off in your Reels.',
    priceDisplay: '$39',
    toolId: 'retention-leak-finder',
    ctaLabel: 'Buy tool',
    entitlements: { tools: ['retention-leak-finder'] },
    trial: { enabled: true, oneTimePerTool: true, mode: 'preview' },
  },
  {
    id: 'tool_cta_match_analyzer',
    type: 'tool',
    title: 'CTA Match Analyzer',
    subtitle: 'Align CTA to audience intent.',
    priceDisplay: '$29',
    toolId: 'cta-match-analyzer',
    ctaLabel: 'Buy tool',
    entitlements: { tools: ['cta-match-analyzer'] },
    trial: { enabled: true, oneTimePerTool: true, mode: 'sandbox' },
  },
  {
    id: 'bundle_creator_stack',
    type: 'bundle',
    title: 'Creator Stack',
    subtitle: 'Core toolkit for creator growth.',
    priceDisplay: '$199',
    ctaLabel: 'Get stack',
    entitlements: { tools: ['hook-analyzer', 'analytics-signal-reader'] },
  },
  {
    id: 'bundle_sales_stack',
    type: 'bundle',
    title: 'Sales Stack',
    subtitle: 'Messaging + CTA optimization suite.',
    priceDisplay: '$249',
    ctaLabel: 'Get stack',
    entitlements: { tools: ['cta-match-analyzer'] },
  },
]

export const PLAN_SKUS = SKU_REGISTRY.filter((sku) =>
  sku.id.startsWith('plan_')
)
export const TOOL_SKUS = SKU_REGISTRY.filter((sku) => sku.type === 'tool')
export const TOKEN_PACK_SKUS = SKU_REGISTRY.filter((sku) => sku.type === 'token_pack')
export const BUNDLE_SKUS = SKU_REGISTRY.filter((sku) => sku.type === 'bundle')

export const findSkuById = (skuId?: string | null) =>
  SKU_REGISTRY.find((sku) => sku.id === skuId)
