import { ToolId } from '@/lib/ai/schemas'

export interface ToolCategory {
  id: string
  name: string
  description: string
  toolIds: ToolId[]
}

export const toolCategories: ToolCategory[] = [
  {
    id: 'content-analysis',
    name: 'Content Analysis',
    description: 'Analyze and diagnose content performance',
    toolIds: [
      'why_post_failed',
      'hook_pressure_test',
      'retention_leak_finder',
      'engagement_diagnostic_lite',
    ],
  },
  {
    id: 'strategy-planning',
    name: 'Strategy Planning',
    description: 'Plan and build content strategies',
    toolIds: [
      'post_type_recommender',
      'algorithm_training_mode',
      'content_system_builder',
      'weekly_strategy_review',
      'controlled_experiment_planner',
      'content_angle_miner_beginner',
    ],
  },
  {
    id: 'dm-tools',
    name: 'DM Tools',
    description: 'DM strategy and messaging tools',
    toolIds: [
      'dm_intelligence_engine',
      'dm_opener_generator_lite',
      'cta_match_checker',
    ],
  },
  {
    id: 'optimization',
    name: 'Optimization',
    description: 'Optimize content and positioning',
    toolIds: [
      'follower_quality_filter',
      'what_to_stop_posting',
      'signal_vs_noise_analyzer',
      'hook_repurposer',
      'ai_hook_rewriter',
    ],
  },
  {
    id: 'conversion',
    name: 'Conversion',
    description: 'Landing pages and offer clarity',
    toolIds: [
      'offer_clarity_fixer_lite',
      'landing_page_message_map_lite',
    ],
  },
]

export function getCategoryByToolId(toolId: ToolId): ToolCategory | undefined {
  return toolCategories.find(cat => cat.toolIds.includes(toolId))
}

export function getToolsByCategory(categoryId: string): ToolId[] {
  const category = toolCategories.find(cat => cat.id === categoryId)
  return category?.toolIds || []
}
