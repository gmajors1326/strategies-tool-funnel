import { z } from 'zod'

// Base schema fields that all tools include
const baseOutputSchema = z.object({
  confidence_level: z.enum(['high', 'medium', 'low']),
  evidence: z.array(z.string()).min(1),
})

// Why Post Failed
export const whyPostFailedSchema = baseOutputSchema.extend({
  primary_failure: z.enum([
    'Hook failed to stop scroll',
    'Retention collapsed mid-post',
    'Idea wasn\'t sharp enough',
    'Too much explanation',
    'Wrong post type for the goal',
    'CTA mismatch',
    'Insufficient signal',
  ]),
  one_fix: z.string(),
  do_not_change: z.array(z.string()).min(2).max(3),
  recommended_next_post_type: z.enum([
    'Pattern-Breaker',
    'Calm Insight',
    'Nobody-Tells-You-This',
    'Framework',
    'Before/After Shift',
    'Identity Alignment',
    'Soft Direction',
  ]),
  one_sentence_reasoning: z.string(),
})

// Hook Pressure Test
export const hookPressureTestSchema = baseOutputSchema.extend({
  hook_strength: z.enum(['strong', 'medium', 'weak']),
  scroll_stop_power: z.number().min(1).max(10),
  curiosity_gap: z.enum(['high', 'medium', 'low', 'none']),
  issues: z.array(z.string()).min(0).max(5),
  improvements: z.array(z.string()).min(1).max(5),
  alternative_hooks: z.array(z.string()).length(3),
  recommended_action: z.string(),
})

// Retention Leak Finder
export const retentionLeakFinderSchema = baseOutputSchema.extend({
  retention_score: z.number().min(1).max(10),
  leak_points: z.array(z.object({
    timestamp: z.string(),
    issue: z.string(),
    impact: z.enum(['high', 'medium', 'low']),
    fix: z.string(),
  })).min(1).max(5),
  overall_pattern: z.string(),
  quick_fixes: z.array(z.string()).min(2).max(4),
  long_term_strategy: z.string(),
})

// Algorithm Training Mode
export const algorithmTrainingModeSchema = baseOutputSchema.extend({
  training_status: z.enum(['well_trained', 'partially_trained', 'untrained']),
  signals_sent: z.array(z.object({
    signal: z.string(),
    strength: z.enum(['strong', 'medium', 'weak']),
    explanation: z.string(),
  })).min(1).max(6),
  missing_signals: z.array(z.string()).min(0).max(4),
  next_post_recommendations: z.array(z.string()).min(2).max(4),
  content_pattern_analysis: z.string(),
})

// Post Type Recommender
export const postTypeRecommenderSchema = baseOutputSchema.extend({
  recommended_post_type: z.enum([
    'Pattern-Breaker Posts',
    'Calm Insight Reels',
    'Nobody-Tells-You-This Posts',
    'Framework / Mental Model Posts',
    'Before/After Thinking Shifts',
    'Identity Alignment Posts',
    'Soft Direction Posts',
    'Insufficient signal',
  ]),
  one_liner: z.string(),
  rules_to_execute: z.array(z.string()).min(3).max(6),
  do_list: z.array(z.string()).min(3).max(5),
  dont_list: z.array(z.string()).min(3).max(5),
  hook_examples: z.array(z.string()).length(5),
  caption_examples: z.array(z.string()).length(3),
  soft_cta_suggestions: z.array(z.string()).length(3),
  spicy_experiment: z.string(),
})

// Union type for all tool schemas
export type WhyPostFailedOutput = z.infer<typeof whyPostFailedSchema>
export type HookPressureTestOutput = z.infer<typeof hookPressureTestSchema>
export type RetentionLeakFinderOutput = z.infer<typeof retentionLeakFinderSchema>
export type AlgorithmTrainingModeOutput = z.infer<typeof algorithmTrainingModeSchema>
export type PostTypeRecommenderOutput = z.infer<typeof postTypeRecommenderSchema>

// Schema registry
export const toolSchemas = {
  why_post_failed: whyPostFailedSchema,
  hook_pressure_test: hookPressureTestSchema,
  retention_leak_finder: retentionLeakFinderSchema,
  algorithm_training_mode: algorithmTrainingModeSchema,
  post_type_recommender: postTypeRecommenderSchema,
} as const

export type ToolId = keyof typeof toolSchemas
