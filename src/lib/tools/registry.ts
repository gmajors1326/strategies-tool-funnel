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
  {
    id: 'dm-opener',
    name: 'DM Opener',
    type: 'light_ai',
    tokensPerRun: 450,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 5,
      lifetime: 10,
      team: 20,
    },
    enabled: true,
  },
  {
    id: 'engagement-diagnostic',
    name: 'Engagement Diagnostic',
    type: 'heavy_ai',
    tokensPerRun: 900,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 3,
      lifetime: 6,
      team: 12,
    },
    enabled: true,
  },
  {
    id: 'hook-repurposer',
    name: 'Hook Repurposer',
    type: 'light_ai',
    tokensPerRun: 350,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 4,
      lifetime: 8,
      team: 15,
    },
    enabled: true,
  },
  {
    id: 'dm-intelligence',
    name: 'DM Intelligence',
    type: 'heavy_ai',
    tokensPerRun: 1100,
    dailyRunsByPlan: {
      free: 0,
      pro_monthly: 2,
      lifetime: 5,
      team: 10,
    },
    enabled: true,
  },
  {
    id: 'retention-leak-finder',
    name: 'Retention Leak Finder',
    type: 'deterministic',
    tokensPerRun: 150,
    dailyRunsByPlan: {
      free: 2,
      pro_monthly: 6,
      lifetime: 12,
      team: 20,
    },
    enabled: false,
  },
]

export const findToolById = (toolId: string): ToolConfig | undefined =>
  TOOL_REGISTRY.find((tool) => tool.id === toolId)
