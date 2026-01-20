import { z } from 'zod'

// Base schema fields that all tools include
const baseOutputSchema = z.object({
  confidence_level: z.enum(['high', 'medium', 'low']),
  evidence: z.array(z.string()).min(1),
})

// Post Types To Outperform
export const postTypesToOutperformSchema = baseOutputSchema.extend({
  recommended_post_type: z.string(),
  post_type_one_liner: z.string(),
  rules_to_execute: z.array(z.string()).min(3).max(7),
  dos: z.array(z.string()).min(3).max(5),
  donts: z.array(z.string()).min(3).max(5),
  hook_examples: z.array(z.string()).length(5),
  caption_examples: z.array(z.string()).length(3),
  cta_suggestions: z.array(z.string()).length(3),
  spicy_experiment: z.string().optional(),
})

// Why Post Failed
export const whyPostFailedSchema = baseOutputSchema.extend({
  primary_failure: z.string(),
  secondary_issues: z.array(z.string()).min(1).max(3),
  one_fix: z.string(),
  hook_analysis: z.object({
    strength: z.enum(['strong', 'weak', 'missing']),
    issue: z.string().optional(),
    suggestion: z.string(),
  }),
  caption_analysis: z.object({
    length_appropriate: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string(),
  }),
  cta_analysis: z.object({
    present: z.boolean(),
    effective: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string(),
  }),
  visual_analysis: z.object({
    engaging: z.boolean(),
    issue: z.string().optional(),
    suggestion: z.string(),
  }),
  next_post_recommendation: z.string(),
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

// Union type for all tool schemas
export type PostTypesToOutperformOutput = z.infer<typeof postTypesToOutperformSchema>
export type WhyPostFailedOutput = z.infer<typeof whyPostFailedSchema>
export type HookPressureTestOutput = z.infer<typeof hookPressureTestSchema>
export type RetentionLeakFinderOutput = z.infer<typeof retentionLeakFinderSchema>
export type AlgorithmTrainingModeOutput = z.infer<typeof algorithmTrainingModeSchema>

// Schema registry
export const toolSchemas = {
  post_types_to_outperform: postTypesToOutperformSchema,
  why_post_failed: whyPostFailedSchema,
  hook_pressure_test: hookPressureTestSchema,
  retention_leak_finder: retentionLeakFinderSchema,
  algorithm_training_mode: algorithmTrainingModeSchema,
} as const

export type ToolId = keyof typeof toolSchemas
