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
  verdict: z.enum(['pass', 'borderline', 'fail', 'insufficient_signal']),
  what_it_triggers: z.enum(['curiosity', 'threat', 'relief', 'status', 'none']),
  strongest_flaw: z.string(),
  one_fix: z.string(),
  rewrites: z.object({
    curiosity: z.array(z.string()).length(2),
    threat: z.array(z.string()).length(2),
    status: z.array(z.string()).length(2),
  }),
  micro_opening_frame: z.string(),
})

// Retention Leak Finder
export const retentionLeakFinderSchema = baseOutputSchema.extend({
  primary_leak: z.enum([
    'Opening frame mismatch',
    'Early pacing stall',
    'Mid-post value drop',
    'Over-explaining',
    'Visual stagnation',
    'Weak loop ending',
    'Insufficient signal',
  ]),
  likely_cause: z.string(),
  one_structural_fix: z.string(),
  cut_list: z.array(z.string()).length(3),
  loop_tweak: z.string(),
})

// Algorithm Training Mode
export const algorithmTrainingModeSchema = baseOutputSchema.extend({
  training_thesis: z.string(),
  sequence: z.array(z.object({
    day: z.number(),
    post_type: z.string(),
    purpose: z.string(),
    success_metric: z.string(),
    hook_template: z.string(),
  })).min(1),
  guardrails: z.array(z.string()).min(4),
  one_spicy_experiment: z.string(),
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
