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

// CTA Match Checker
export const ctaMatchCheckerSchema = baseOutputSchema.extend({
  match_verdict: z.enum(['match', 'weak', 'mismatch', 'Insufficient signal']),
  why_short: z.string(),
  best_single_action: z.enum(['save', 'follow', 'dm', 'click', 'comment']),
  rewritten_ctas: z.array(z.string()).length(5),
  placement_instruction: z.string(),
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

// Signal vs Noise Analyzer
export const signalVsNoiseAnalyzerSchema = baseOutputSchema.extend({
  metric_weights: z.array(z.object({
    metric: z.string(),
    weight: z.number(),
    why: z.string(),
  })),
  north_star_metric: z.string(),
  ignore_list: z.array(z.string()).min(3).max(5),
  weekly_review_questions: z.array(z.string()).length(5),
})

// AI Hook Rewriter (Bounded)
export const aiHookRewriterSchema = baseOutputSchema.extend({
  hooks: z.array(z.string()).length(12),
  best_3: z.array(z.number()).length(3),
  opening_frame_suggestions: z.array(z.string()).min(1),
})

// Weekly Strategy Review
export const weeklyStrategyReviewSchema = baseOutputSchema.extend({
  one_pattern: z.string(),
  one_change_next_week: z.string(),
  keep_doing: z.array(z.string()).length(3),
  stop_doing: z.array(z.string()).length(2),
  next_week_plan: z.array(z.object({
    slot: z.number(),
    post_type: z.string(),
    intent: z.string(),
    hook_prompt: z.string(),
  })).length(5),
})

// DM Intelligence Engine
export const dmIntelligenceEngineSchema = baseOutputSchema.extend({
  recommended_reply: z.string(),
  reasoning_summary: z.string(),
  risk_assessment: z.object({
    level: z.enum(['low', 'medium', 'high']),
    flags: z.array(z.string()),
    avoid_saying: z.array(z.string()),
  }),
  next_step: z.object({
    objective: z.string(),
    question_to_ask: z.string(),
    fallback_if_no_reply: z.string(),
  }),
})

// Hook Repurposer
export const hookRepurposerSchema = baseOutputSchema.extend({
  best_angle: z.enum(['curiosity', 'threat', 'relief', 'status', 'contrarian']),
  hooks: z.array(z.string()).length(10),
  angle_labels: z.array(z.string()).length(10),
  pattern_break_openers: z.array(z.string()).min(1),
})

// Engagement Diagnostic (Lite)
export const engagementDiagnosticLiteSchema = baseOutputSchema.extend({
  tier: z.enum(['stalled', 'warming_up', 'healthy', 'spiking']),
  primary_bottleneck: z.enum([
    'hook',
    'retention',
    'offer_clarity',
    'topic_fit',
    'cta_alignment',
    'insufficient_signal',
  ]),
  one_actionable_insight: z.string(),
  one_next_action: z.string(),
})

// DM Opener Generator (Lite)
export const dmOpenerGeneratorLiteSchema = baseOutputSchema.extend({
  opener: z.string(),
  follow_up_if_seen_no_reply: z.string(),
})

// Offer Clarity Fixer (Lite)
export const offerClarityFixerLiteSchema = baseOutputSchema.extend({
  offer_statement: z.string(),
  deliverables: z.array(z.string()).length(3),
  outcomes: z.array(z.string()).length(3),
  best_next_action: z.enum(['dm', 'call', 'signup', 'download']),
  dm_pitch_lines: z.array(z.string()).length(5),
})

// Landing Page Message Map (Lite)
export const landingPageMessageMapLiteSchema = baseOutputSchema.extend({
  hero_headline: z.string(),
  hero_subheadline: z.string(),
  benefit_bullets: z.array(z.string()).length(3),
  credibility_bullets: z.array(z.string()).length(3),
  objection_line: z.string(),
  cta_button_label: z.string(),
  form_prompt: z.string(),
})

// Content Angle Miner (Beginner)
export const contentAngleMinerBeginnerSchema = baseOutputSchema.extend({
  buckets: z.array(z.object({
    bucket_name: z.string(),
    angles: z.array(z.object({
      angle_name: z.string(),
      who_it_hits: z.string(),
      hook_template: z.string(),
      save_reason: z.string(),
      suggested_post_type: z.string(),
    })).length(4),
  })).length(3),
})

// Union type for all tool schemas
export type WhyPostFailedOutput = z.infer<typeof whyPostFailedSchema>
export type HookPressureTestOutput = z.infer<typeof hookPressureTestSchema>
export type RetentionLeakFinderOutput = z.infer<typeof retentionLeakFinderSchema>
export type AlgorithmTrainingModeOutput = z.infer<typeof algorithmTrainingModeSchema>
export type PostTypeRecommenderOutput = z.infer<typeof postTypeRecommenderSchema>
export type CtaMatchCheckerOutput = z.infer<typeof ctaMatchCheckerSchema>
export type FollowerQualityFilterOutput = z.infer<typeof followerQualityFilterSchema>
export type ContentSystemBuilderOutput = z.infer<typeof contentSystemBuilderSchema>
export type WhatToStopPostingOutput = z.infer<typeof whatToStopPostingSchema>
export type ControlledExperimentPlannerOutput = z.infer<typeof controlledExperimentPlannerSchema>
export type SignalVsNoiseAnalyzerOutput = z.infer<typeof signalVsNoiseAnalyzerSchema>
export type AIHookRewriterOutput = z.infer<typeof aiHookRewriterSchema>
export type WeeklyStrategyReviewOutput = z.infer<typeof weeklyStrategyReviewSchema>
export type DMIntelligenceEngineOutput = z.infer<typeof dmIntelligenceEngineSchema>
export type HookRepurposerOutput = z.infer<typeof hookRepurposerSchema>
export type EngagementDiagnosticLiteOutput = z.infer<typeof engagementDiagnosticLiteSchema>
export type DMOpenerGeneratorLiteOutput = z.infer<typeof dmOpenerGeneratorLiteSchema>
export type OfferClarityFixerLiteOutput = z.infer<typeof offerClarityFixerLiteSchema>
export type LandingPageMessageMapLiteOutput = z.infer<typeof landingPageMessageMapLiteSchema>
export type ContentAngleMinerBeginnerOutput = z.infer<typeof contentAngleMinerBeginnerSchema>

// Schema registry
export const toolSchemas = {
  why_post_failed: whyPostFailedSchema,
  hook_pressure_test: hookPressureTestSchema,
  retention_leak_finder: retentionLeakFinderSchema,
  algorithm_training_mode: algorithmTrainingModeSchema,
  post_type_recommender: postTypeRecommenderSchema,
  cta_match_checker: ctaMatchCheckerSchema,
  follower_quality_filter: followerQualityFilterSchema,
  content_system_builder: contentSystemBuilderSchema,
  what_to_stop_posting: whatToStopPostingSchema,
  controlled_experiment_planner: controlledExperimentPlannerSchema,
  signal_vs_noise_analyzer: signalVsNoiseAnalyzerSchema,
  ai_hook_rewriter: aiHookRewriterSchema,
  weekly_strategy_review: weeklyStrategyReviewSchema,
  dm_intelligence_engine: dmIntelligenceEngineSchema,
  hook_repurposer: hookRepurposerSchema,
  engagement_diagnostic_lite: engagementDiagnosticLiteSchema,
  dm_opener_generator_lite: dmOpenerGeneratorLiteSchema,
  offer_clarity_fixer_lite: offerClarityFixerLiteSchema,
  landing_page_message_map_lite: landingPageMessageMapLiteSchema,
  content_angle_miner_beginner: contentAngleMinerBeginnerSchema,
} as const

export type ToolId = keyof typeof toolSchemas
