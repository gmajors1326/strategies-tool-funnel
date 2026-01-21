import type { PlanId } from '@/src/lib/plans'

export type ToolType = 'deterministic' | 'light_ai' | 'heavy_ai'

export type ToolConfig = {
  id: string
  name: string
  type: ToolType
  tokensPerRun: number
  dailyRunsByPlan: Record<PlanId, number>
  enabled: boolean
}

export const TOOL_REGISTRY: ToolConfig[] = [
  // 1) DM / Conversation (money zone)
  {
    id: 'dm-opener',
    name: 'DM Opener',
    type: 'light_ai',
    tokensPerRun: 450,
    dailyRunsByPlan: { free: 1, pro_monthly: 6, lifetime: 12, team: 25 },
    enabled: true,
  },
  {
    id: 'dm-reply-builder',
    name: 'DM Reply Builder',
    type: 'light_ai',
    tokensPerRun: 500,
    dailyRunsByPlan: { free: 1, pro_monthly: 5, lifetime: 10, team: 20 },
    enabled: true,
  },
  {
    id: 'dm-objection-crusher',
    name: 'DM Objection Crusher',
    type: 'heavy_ai',
    tokensPerRun: 950,
    dailyRunsByPlan: { free: 0, pro_monthly: 3, lifetime: 7, team: 14 },
    enabled: true,
  },
  {
    id: 'dm-intelligence',
    name: 'DM Intelligence Engine',
    type: 'heavy_ai',
    tokensPerRun: 1100,
    dailyRunsByPlan: { free: 0, pro_monthly: 2, lifetime: 6, team: 12 },
    enabled: true,
  },

  // 2) Hooks / Reels performance
  {
    id: 'hook-repurposer',
    name: 'Hook Repurposer',
    type: 'light_ai',
    tokensPerRun: 350,
    dailyRunsByPlan: { free: 1, pro_monthly: 8, lifetime: 15, team: 30 },
    enabled: true,
  },
  {
    id: 'hook-library-builder',
    name: 'Hook Library Builder',
    type: 'light_ai',
    tokensPerRun: 420,
    dailyRunsByPlan: { free: 1, pro_monthly: 6, lifetime: 12, team: 24 },
    enabled: true,
  },
  {
    id: 'retention-leak-finder',
    name: 'Retention Leak Finder',
    type: 'deterministic',
    tokensPerRun: 180,
    dailyRunsByPlan: { free: 2, pro_monthly: 10, lifetime: 20, team: 40 },
    enabled: true,
  },
  {
    id: 'reel-script-6sec',
    name: '6-Second Reel Script Builder',
    type: 'light_ai',
    tokensPerRun: 480,
    dailyRunsByPlan: { free: 1, pro_monthly: 6, lifetime: 12, team: 24 },
    enabled: true,
  },
  {
    id: 'reel-do-not-post',
    name: 'Do-Not-Post Filter',
    type: 'deterministic',
    tokensPerRun: 120,
    dailyRunsByPlan: { free: 2, pro_monthly: 12, lifetime: 25, team: 50 },
    enabled: true,
  },

  // 3) Account diagnostics / positioning
  {
    id: 'engagement-diagnostic',
    name: 'Engagement Diagnostic',
    type: 'heavy_ai',
    tokensPerRun: 900,
    dailyRunsByPlan: { free: 1, pro_monthly: 3, lifetime: 8, team: 16 },
    enabled: true,
  },
  {
    id: 'profile-clarity-audit',
    name: 'Profile Clarity Audit',
    type: 'light_ai',
    tokensPerRun: 520,
    dailyRunsByPlan: { free: 1, pro_monthly: 4, lifetime: 10, team: 20 },
    enabled: true,
  },
  {
    id: 'niche-magnet',
    name: 'Niche Magnet (Who This Is For)',
    type: 'light_ai',
    tokensPerRun: 500,
    dailyRunsByPlan: { free: 1, pro_monthly: 4, lifetime: 10, team: 20 },
    enabled: true,
  },

  // 4) Offers / conversion sanity
  {
    id: 'cta-match-analyzer',
    name: 'CTA Match Analyzer',
    type: 'deterministic',
    tokensPerRun: 140,
    dailyRunsByPlan: { free: 2, pro_monthly: 12, lifetime: 25, team: 50 },
    enabled: true,
  },
  {
    id: 'offer-one-liner',
    name: 'Offer One-Liner Builder',
    type: 'light_ai',
    tokensPerRun: 420,
    dailyRunsByPlan: { free: 1, pro_monthly: 6, lifetime: 12, team: 24 },
    enabled: true,
  },
  {
    id: 'landing-page-teardown',
    name: 'Landing Page Teardown',
    type: 'heavy_ai',
    tokensPerRun: 1200,
    dailyRunsByPlan: { free: 0, pro_monthly: 2, lifetime: 6, team: 12 },
    enabled: true,
  },

  // 5) Content planning / consistency
  {
    id: '30-day-reels-plan',
    name: '30-Day Reels Plan Builder',
    type: 'heavy_ai',
    tokensPerRun: 1300,
    dailyRunsByPlan: { free: 0, pro_monthly: 1, lifetime: 4, team: 8 },
    enabled: true,
  },
  {
    id: 'content-pillar-generator',
    name: 'Content Pillar Generator',
    type: 'light_ai',
    tokensPerRun: 480,
    dailyRunsByPlan: { free: 1, pro_monthly: 5, lifetime: 12, team: 24 },
    enabled: true,
  },

  // 6) Comments / community (underrated growth lever)
  {
    id: 'comment-reply-generator',
    name: 'Comment Reply Generator',
    type: 'light_ai',
    tokensPerRun: 300,
    dailyRunsByPlan: { free: 2, pro_monthly: 10, lifetime: 20, team: 40 },
    enabled: true,
  },

  // 7) Competitive + swipe file intelligence
  {
    id: 'competitor-reverse-engineer',
    name: 'Competitor Reverse Engineer',
    type: 'heavy_ai',
    tokensPerRun: 1250,
    dailyRunsByPlan: { free: 0, pro_monthly: 2, lifetime: 5, team: 10 },
    enabled: true,
  },

  // 8) Captions (short, non-cringe)
  {
    id: 'caption-polisher',
    name: 'Caption Polisher',
    type: 'light_ai',
    tokensPerRun: 320,
    dailyRunsByPlan: { free: 2, pro_monthly: 10, lifetime: 20, team: 40 },
    enabled: true,
  },
]

export const findToolById = (toolId: string): ToolConfig | undefined =>
  TOOL_REGISTRY.find((tool) => tool.id === toolId)
