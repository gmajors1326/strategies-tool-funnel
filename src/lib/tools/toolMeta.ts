export type ToolMeta = {
  id: string
  name: string
  category: string
  aiLevel: 'none' | 'light' | 'heavy'
  tokensPerRun: number
  requiresPurchase: boolean
  includedInPlans?: Array<'free' | 'pro_monthly' | 'team' | 'lifetime'>
  dailyRunsByPlan?: Record<'free' | 'pro_monthly' | 'team' | 'lifetime', number>
  enabled: boolean
}

export const TOOL_META: ToolMeta[] = [
  {
    id: 'hook-analyzer',
    name: 'Hook Analyzer',
    category: 'Messaging',
    aiLevel: 'light',
    tokensPerRun: 300,
    requiresPurchase: true,
    includedInPlans: ['pro_monthly', 'team', 'lifetime'],
    dailyRunsByPlan: { free: 1, pro_monthly: 10, team: 20, lifetime: 15 },
    enabled: true,
  },
  {
    id: 'ig-post-intelligence',
    name: 'IG Post Intelligence',
    category: 'Content',
    aiLevel: 'heavy',
    tokensPerRun: 700,
    requiresPurchase: true,
    includedInPlans: ['team', 'lifetime'],
    dailyRunsByPlan: { free: 0, pro_monthly: 5, team: 12, lifetime: 10 },
    enabled: true,
  },
  {
    id: 'yt-video-intelligence',
    name: 'YT Video Intelligence',
    category: 'Video',
    aiLevel: 'heavy',
    tokensPerRun: 800,
    requiresPurchase: true,
    includedInPlans: ['team', 'lifetime'],
    dailyRunsByPlan: { free: 0, pro_monthly: 3, team: 10, lifetime: 8 },
    enabled: true,
  },
  {
    id: 'cta-match-analyzer',
    name: 'CTA Match Analyzer',
    category: 'Conversion',
    aiLevel: 'light',
    tokensPerRun: 280,
    requiresPurchase: true,
    includedInPlans: ['pro_monthly', 'team', 'lifetime'],
    dailyRunsByPlan: { free: 1, pro_monthly: 8, team: 16, lifetime: 12 },
    enabled: true,
  },
  {
    id: 'creator-overview',
    name: 'Creator Overview',
    category: 'Insights',
    aiLevel: 'none',
    tokensPerRun: 0,
    requiresPurchase: false,
    includedInPlans: ['free', 'pro_monthly', 'team', 'lifetime'],
    dailyRunsByPlan: { free: 3, pro_monthly: 10, team: 20, lifetime: 15 },
    enabled: true,
  },
]
