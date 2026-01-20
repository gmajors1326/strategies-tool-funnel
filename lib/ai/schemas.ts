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

// Follower Quality Filter
export const followerQualityFilterSchema = baseOutputSchema.extend({
  positioning_sentence: z.string(),
  language_to_use: z.array(z.string()).length(8),
  language_to_avoid: z.array(z.string()).length(8),
  post_types_to_attract: z.array(z.string()).length(3),
  post_types_to_repel: z.array(z.string()).length(3),
  bio_line_optional: z.string(),
})

// Content System Builder
export const contentSystemBuilderSchema = baseOutputSchema.extend({
  system_name: z.string(),
  weekly_plan: z.array(z.object({
    day: z.string(),
    post_type: z.string(),
    objective: z.string(),
    hook_rule: z.string(),
    cta_rule: z.string(),
  })).min(1),
  nonnegotiables: z.array(z.string()).min(3).max(6),
  templates: z.array(z.object({
    post_type: z.string(),
    hook_templates: z.array(z.string()).length(3),
    caption_templates: z.array(z.string()).length(2),
  })).min(1),
})

// What to Stop Posting
export const whatToStopPostingSchema = baseOutputSchema.extend({
  stop_list: z.array(z.object({
    thing: z.string(),
    why: z.string(),
    replacement: z.string(),
  })).length(5),
  keep_list: z.array(z.string()).length(3),
  one_rule_to_enforce: z.string(),
})

// Controlled Experiment Planner
export const controlledExperimentPlannerSchema = baseOutputSchema.extend({
  hypothesis: z.string(),
  control_definition: z.string(),
  variable_to_change: z.string(),
  test_matrix: z.array(z.object({
    post_number: z.number(),
    change: z.string(),
    keep_constant: z.array(z.string()).min(4),
  })).min(1),
  success_metric: z.string(),
  decision_rule: z.string(),
})

// Union type for all tool schemas
export type WhyPostFailedOutput = z.infer<typeof whyPostFailedSchema>
export type HookPressureTestOutput = z.infer<typeof hookPressureTestSchema>
export type RetentionLeakFinderOutput = z.infer<typeof retentionLeakFinderSchema>
export type AlgorithmTrainingModeOutput = z.infer<typeof algorithmTrainingModeSchema>
export type PostTypeRecommenderOutput = z.infer<typeof postTypeRecommenderSchema>
export type FollowerQualityFilterOutput = z.infer<typeof followerQualityFilterSchema>
export type ContentSystemBuilderOutput = z.infer<typeof contentSystemBuilderSchema>
export type WhatToStopPostingOutput = z.infer<typeof whatToStopPostingSchema>
export type ControlledExperimentPlannerOutput = z.infer<typeof controlledExperimentPlannerSchema>

// Schema registry
export const toolSchemas = {
  why_post_failed: whyPostFailedSchema,
  hook_pressure_test: hookPressureTestSchema,
  retention_leak_finder: retentionLeakFinderSchema,
  algorithm_training_mode: algorithmTrainingModeSchema,
  post_type_recommender: postTypeRecommenderSchema,
  follower_quality_filter: followerQualityFilterSchema,
  content_system_builder: contentSystemBuilderSchema,
  what_to_stop_posting: whatToStopPostingSchema,
  controlled_experiment_planner: controlledExperimentPlannerSchema,
} as const

export type ToolId = keyof typeof toolSchemas
