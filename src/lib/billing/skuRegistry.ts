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
    ctaLabel: 'Start free',
    entitlements: { planId: 'free' },
  },
  {
    id: 'plan_pro_monthly',
    type: 'subscription',
    title: 'Pro Monthly',
    subtitle: 'For serious creators scaling output.',
    priceDisplay: '$49',
    billingInterval: 'month',
    ctaLabel: 'Go Pro',
    entitlements: { planId: 'pro_monthly' },
  },
  {
    id: 'plan_team_monthly',
    type: 'subscription',
    title: 'Team Monthly',
    subtitle: 'Collaborate with your team.',
    priceDisplay: '$149',
    billingInterval: 'month',
    ctaLabel: 'Start Team',
    entitlements: { planId: 'team', seats: 5 },
  },
  {
    id: 'plan_lifetime',
    type: 'lifetime',
    title: 'Lifetime',
    subtitle: 'Pay once. Unlock forever.',
    priceDisplay: '$799',
    billingInterval: null,
    ctaLabel: 'Get Lifetime',
    entitlements: { planId: 'lifetime' },
  },
  {
    id: 'tokens_starter',
    type: 'token_pack',
    title: 'Starter Tokens',
    subtitle: 'Quick top-up for light usage.',
    priceDisplay: '$12',
    tokensGranted: 5000,
    ctaLabel: 'Buy Starter',
  },
  {
    id: 'tokens_builder',
    type: 'token_pack',
    title: 'Builder Tokens',
    subtitle: 'Best value for regular runs.',
    priceDisplay: '$39',
    tokensGranted: 20000,
    featured: true,
    ctaLabel: 'Buy Builder',
  },
  {
    id: 'tokens_pro',
    type: 'token_pack',
    title: 'Pro Tokens',
    subtitle: 'Heavy usage for scaling teams.',
    priceDisplay: '$89',
    tokensGranted: 50000,
    ctaLabel: 'Buy Pro',
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
