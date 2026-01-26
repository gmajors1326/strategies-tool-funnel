export type PlanTier = 'free' | 'pro' | 'elite'

export type PlanEntitlements = {
  canSaveVault: boolean
  canExportJsonCsv: boolean
  canExportPdf: boolean
  historyDepth: number | 'unlimited'
  cooldownPolicy: 'standard' | 'reduced' | 'none'
}

export type PlanCatalogEntry = {
  tier: PlanTier
  displayName: string
  monthlyPrice: number
  internalPlanId: 'free' | 'pro_monthly' | 'team'
  features: string[]
  entitlements: PlanEntitlements
}

export const PLAN_CATALOG: Record<PlanTier, PlanCatalogEntry> = {
  free: {
    tier: 'free',
    displayName: 'Free',
    monthlyPrice: 0,
    internalPlanId: 'free',
    features: ['200 daily tokens', 'Core tools', 'Standard cooldowns', '3-run history', 'Basic exports'],
    entitlements: {
      canSaveVault: false,
      canExportJsonCsv: false,
      canExportPdf: false,
      historyDepth: 3,
      cooldownPolicy: 'standard',
    },
  },
  pro: {
    tier: 'pro',
    displayName: 'Pro',
    monthlyPrice: 39,
    internalPlanId: 'pro_monthly',
    features: ['2,000 daily tokens', 'All 5 tools', 'Reduced cooldowns', '20-run history', 'Save + export JSON/CSV'],
    entitlements: {
      canSaveVault: true,
      canExportJsonCsv: true,
      canExportPdf: false,
      historyDepth: 20,
      cooldownPolicy: 'reduced',
    },
  },
  elite: {
    tier: 'elite',
    displayName: 'Elite',
    monthlyPrice: 99,
    internalPlanId: 'team',
    features: ['6,000 daily tokens', 'All 5 tools', 'No cooldowns', 'Unlimited history', 'All exports'],
    entitlements: {
      canSaveVault: true,
      canExportJsonCsv: true,
      canExportPdf: true,
      historyDepth: 'unlimited',
      cooldownPolicy: 'none',
    },
  },
}

export function getPlanTierFromPlanId(planId?: string | null): PlanTier {
  if (planId === 'pro_monthly') return 'pro'
  if (planId === 'team') return 'elite'
  return 'free'
}

export function getPlanCatalog(tier: PlanTier) {
  return PLAN_CATALOG[tier]
}
