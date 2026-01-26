export type PlanTier = 'free' | 'pro' | 'elite'

export const DAILY_TOKENS: Record<PlanTier, number> = {
  free: 200,
  pro: 2000,
  elite: 6000,
}

export const TOOL_COSTS: Record<
  'hook-analyzer' | 'cta-match-analyzer' | 'content-angle-generator' | 'caption-optimizer' | 'engagement-diagnostic',
  number
> = {
  'hook-analyzer': 40,
  'cta-match-analyzer': 50,
  'content-angle-generator': 80,
  'caption-optimizer': 60,
  'engagement-diagnostic': 90,
}

export function getDailyTokens(tier: PlanTier) {
  return DAILY_TOKENS[tier]
}

export function getToolCost(toolId: keyof typeof TOOL_COSTS) {
  return TOOL_COSTS[toolId]
}
