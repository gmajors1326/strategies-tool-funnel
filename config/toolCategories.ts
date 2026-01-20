import { Search, Zap, Compass, Layers, FlaskConical, LucideIcon } from 'lucide-react'

export interface ToolCategory {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: {
    accent: string
    badgeBg: string
    badgeBorder: string
  }
  tools: ToolReference[]
}

export interface ToolReference {
  id: number
  toolId: string
  name: string
  stage: 'analyze' | 'execute' | 'decide' | 'systemize' | 'optimize'
  risk_level: 'low' | 'medium' | 'high'
}

export interface UnlockStep {
  step: number
  tool_id: number
  toolId: string
  name: string
  unlock_condition: UnlockCondition
  why_unlocked: string
}

export type UnlockCondition =
  | { type: 'first_login' }
  | { type: 'tool_used'; tool_id: number; times: number }
  | { type: 'tools_used_any'; tool_ids: number[]; times_each: number }

export const toolCategories: ToolCategory[] = [
  {
    id: 'diagnosis_analysis',
    name: 'Diagnosis & Analysis',
    description: 'Identify what is broken before making changes.',
    icon: Search,
    color: {
      accent: '#60A5FA',
      badgeBg: 'rgba(96,165,250,0.12)',
      badgeBorder: 'rgba(96,165,250,0.28)',
    },
    tools: [
      { id: 1, toolId: 'why_post_failed', name: 'Why This Post Failed', stage: 'analyze', risk_level: 'low' },
      { id: 4, toolId: 'retention_leak_finder', name: 'Retention Leak Finder', stage: 'analyze', risk_level: 'low' },
    ],
  },
  {
    id: 'hooks_attention',
    name: 'Hooks & Attention Control',
    description: 'Control the first seconds and stop the scroll.',
    icon: Zap,
    color: {
      accent: '#FBBF24',
      badgeBg: 'rgba(251,191,36,0.12)',
      badgeBorder: 'rgba(251,191,36,0.28)',
    },
    tools: [
      { id: 3, toolId: 'hook_pressure_test', name: 'Hook Pressure Test', stage: 'execute', risk_level: 'low' },
    ],
  },
  {
    id: 'strategy_decision',
    name: 'Strategy & Decision Engines',
    description: 'Decide what to post and how to train the algorithm.',
    icon: Compass,
    color: {
      accent: '#F87171',
      badgeBg: 'rgba(248,113,113,0.12)',
      badgeBorder: 'rgba(248,113,113,0.28)',
    },
    tools: [
      { id: 2, toolId: 'post_type_recommender', name: 'Post Types to Outperform', stage: 'decide', risk_level: 'low' },
      { id: 5, toolId: 'algorithm_training_mode', name: 'Algorithm Training Mode', stage: 'decide', risk_level: 'medium' },
      { id: 6, toolId: 'cta_match_checker', name: 'CTA Match Analyzer', stage: 'decide', risk_level: 'medium' },
      { id: 7, toolId: 'follower_quality_filter', name: 'Follower Quality Filter', stage: 'decide', risk_level: 'medium' },
    ],
  },
  {
    id: 'systems_consistency',
    name: 'Systems & Consistency',
    description: 'Replace randomness with repeatable systems.',
    icon: Layers,
    color: {
      accent: '#34D399',
      badgeBg: 'rgba(52,211,153,0.12)',
      badgeBorder: 'rgba(52,211,153,0.28)',
    },
    tools: [
      { id: 8, toolId: 'content_system_builder', name: 'Content System Builder', stage: 'systemize', risk_level: 'low' },
      { id: 9, toolId: 'what_to_stop_posting', name: 'What to Stop Posting', stage: 'systemize', risk_level: 'low' },
    ],
  },
  {
    id: 'optimization_experimentation',
    name: 'Optimization & Experimentation',
    description: 'Improve performance through controlled testing.',
    icon: FlaskConical,
    color: {
      accent: '#A78BFA',
      badgeBg: 'rgba(167,139,250,0.12)',
      badgeBorder: 'rgba(167,139,250,0.28)',
    },
    tools: [
      { id: 10, toolId: 'controlled_experiment_planner', name: 'Controlled Experiment Planner', stage: 'optimize', risk_level: 'high' },
    ],
  },
]

export const unlockSteps: UnlockStep[] = [
  {
    step: 1,
    tool_id: 3,
    toolId: 'hook_pressure_test',
    name: 'Hook Pressure Test',
    unlock_condition: { type: 'first_login' },
    why_unlocked: 'Start with the fastest win: scroll-stop.',
  },
  {
    step: 2,
    tool_id: 4,
    toolId: 'retention_leak_finder',
    name: 'Retention Leak Finder',
    unlock_condition: { type: 'tool_used', tool_id: 3, times: 1 },
    why_unlocked: 'If the hook passes, fix where attention drops.',
  },
  {
    step: 3,
    tool_id: 1,
    toolId: 'why_post_failed',
    name: 'Why This Post Failed',
    unlock_condition: { type: 'tool_used', tool_id: 4, times: 1 },
    why_unlocked: 'Now diagnose the full bottleneck with evidence.',
  },
  {
    step: 4,
    tool_id: 2,
    toolId: 'post_type_recommender',
    name: 'Post Types to Outperform',
    unlock_condition: { type: 'tool_used', tool_id: 1, times: 1 },
    why_unlocked: 'Turn diagnosis into a clear next-post decision.',
  },
  {
    step: 5,
    tool_id: 6,
    toolId: 'cta_match_checker',
    name: 'CTA Match Analyzer',
    unlock_condition: { type: 'tool_used', tool_id: 2, times: 1 },
    why_unlocked: 'Stop wasting attention with the wrong ask.',
  },
  {
    step: 6,
    tool_id: 7,
    toolId: 'follower_quality_filter',
    name: 'Follower Quality Filter',
    unlock_condition: { type: 'tool_used', tool_id: 6, times: 1 },
    why_unlocked: 'Lock in audience precision before scaling.',
  },
  {
    step: 7,
    tool_id: 5,
    toolId: 'algorithm_training_mode',
    name: 'Algorithm Training Mode',
    unlock_condition: { type: 'tools_used_any', tool_ids: [2, 3, 4], times_each: 2 },
    why_unlocked: 'Graduate to sequencing once fundamentals are stable.',
  },
  {
    step: 8,
    tool_id: 8,
    toolId: 'content_system_builder',
    name: 'Content System Builder',
    unlock_condition: { type: 'tool_used', tool_id: 5, times: 1 },
    why_unlocked: 'Turn strategy into a weekly system.',
  },
  {
    step: 9,
    tool_id: 9,
    toolId: 'what_to_stop_posting',
    name: 'What to Stop Posting',
    unlock_condition: { type: 'tool_used', tool_id: 8, times: 1 },
    why_unlocked: 'Cut dead weight so the system performs.',
  },
  {
    step: 10,
    tool_id: 10,
    toolId: 'controlled_experiment_planner',
    name: 'Controlled Experiment Planner',
    unlock_condition: { type: 'tools_used_any', tool_ids: [1, 2, 3, 4, 6], times_each: 2 },
    why_unlocked: 'Only run experiments after you can diagnose and execute basics.',
  },
]

export const unlockRules = {
  default_locked: true,
  allow_skip_for_admin: false, // Set to true for testing
  show_next_unlock_hint: true,
}
