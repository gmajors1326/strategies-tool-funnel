import { ToolId, toolSchemas } from './schemas'
import { getToolPrompt } from './prompts'

export interface ToolConfig {
  toolId: ToolId
  title: string
  description: string
  inputFields: InputField[]
  outputSections: OutputSection[]
}

export interface InputField {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number'
  required: boolean
  placeholder?: string
  options?: string[]
  maxLength?: number
  minLength?: number
}

export interface OutputSection {
  key: string
  title: string
  type: 'text' | 'list' | 'object' | 'score'
  copyable: boolean
}

export const toolRegistry: Record<ToolId, ToolConfig> = {
  why_post_failed: {
    toolId: 'why_post_failed',
    title: 'Why This Post Failed',
    description: 'Diagnose why a post underperformed. Decisive, evidence-based, one fix only.',
    inputFields: [
      {
        key: 'post_type',
        label: 'Post Type',
        type: 'select',
        required: true,
        options: [
          'Pattern-Breaker',
          'Calm Insight',
          'Nobody-Tells-You-This',
          'Framework',
          'Before/After Shift',
          'Identity Alignment',
          'Soft Direction',
        ],
      },
      {
        key: 'primary_goal',
        label: 'Primary Goal',
        type: 'select',
        required: true,
        options: [
          'Reach',
          'Retention',
          'Authority',
          'Saves',
          'Profile Visits',
          'Followers',
          'DMs',
        ],
      },
      {
        key: 'views',
        label: 'Views',
        type: 'number',
        required: true,
        placeholder: 'Total views',
      },
      {
        key: 'avg_watch_time_sec',
        label: 'Avg Watch Time (seconds)',
        type: 'number',
        required: true,
        placeholder: 'Average watch time in seconds',
      },
      {
        key: 'retention_pct_optional',
        label: 'Retention % (Optional)',
        type: 'number',
        required: false,
        placeholder: 'Retention percentage if available',
      },
      {
        key: 'saves',
        label: 'Saves',
        type: 'number',
        required: true,
        placeholder: 'Number of saves',
      },
      {
        key: 'profile_visits',
        label: 'Profile Visits',
        type: 'number',
        required: true,
        placeholder: 'Number of profile visits',
      },
      {
        key: 'hook_felt_strong',
        label: 'Hook Felt Strong',
        type: 'select',
        required: true,
        options: ['true', 'false'],
      },
      {
        key: 'looped_cleanly',
        label: 'Looped Cleanly',
        type: 'select',
        required: true,
        options: ['true', 'false'],
      },
      {
        key: 'one_clear_idea',
        label: 'One Clear Idea',
        type: 'select',
        required: true,
        options: ['true', 'false'],
      },
      {
        key: 'calm_delivery',
        label: 'Calm Delivery',
        type: 'select',
        required: true,
        options: ['true', 'false'],
      },
      {
        key: 'single_cta',
        label: 'Single CTA',
        type: 'select',
        required: true,
        options: ['true', 'false'],
      },
      {
        key: 'notes_optional',
        label: 'Notes (Optional)',
        type: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: 'Any additional context',
      },
    ],
    outputSections: [
      { key: 'primary_failure', title: 'Primary Failure', type: 'text', copyable: true },
      { key: 'confidence_level', title: 'Confidence Level', type: 'text', copyable: false },
      { key: 'evidence', title: 'Evidence', type: 'list', copyable: true },
      { key: 'one_fix', title: 'One Fix', type: 'text', copyable: true },
      { key: 'do_not_change', title: 'Do Not Change', type: 'list', copyable: true },
      { key: 'recommended_next_post_type', title: 'Recommended Next Post Type', type: 'text', copyable: true },
      { key: 'one_sentence_reasoning', title: 'Reasoning', type: 'text', copyable: true },
    ],
  },
  hook_pressure_test: {
    toolId: 'hook_pressure_test',
    title: 'Hook Pressure Test',
    description: 'Pressure-test your hook as if you have 1–1.5 seconds to stop the scroll. Fast. Cold. Unforgiving.',
    inputFields: [
      {
        key: 'hook_text',
        label: 'Hook Text',
        type: 'textarea',
        required: true,
        maxLength: 200,
        placeholder: 'Paste your hook here',
      },
      {
        key: 'post_type_optional',
        label: 'Post Type (Optional)',
        type: 'select',
        required: false,
        options: [
          'Pattern-Breaker',
          'Calm Insight',
          'Nobody-Tells-You-This',
          'Framework',
          'Before/After Shift',
          'Identity Alignment',
          'Soft Direction',
        ],
        placeholder: 'Select post type...',
      },
      {
        key: 'audience_optional',
        label: 'Target Audience (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., fitness coaches, SaaS founders',
        maxLength: 100,
      },
      {
        key: 'tone_optional',
        label: 'Desired Tone (Optional)',
        type: 'select',
        required: false,
        options: ['calm', 'blunt', 'neutral'],
        placeholder: 'Select tone...',
      },
    ],
    outputSections: [
      { key: 'verdict', title: 'Verdict', type: 'text', copyable: true },
      { key: 'what_it_triggers', title: 'What It Triggers', type: 'text', copyable: true },
      { key: 'strongest_flaw', title: 'Strongest Flaw', type: 'text', copyable: true },
      { key: 'one_fix', title: 'One Fix', type: 'text', copyable: true },
      { key: 'rewrites', title: 'Rewrites by Psychological Angle', type: 'object', copyable: true },
      { key: 'micro_opening_frame', title: 'Micro Opening Frame', type: 'text', copyable: true },
    ],
  },
  retention_leak_finder: {
    toolId: 'retention_leak_finder',
    title: 'Retention Leak Finder',
    description: 'Find where viewers drop off and why.',
    inputFields: [
      {
        key: 'content_description',
        label: 'Content Description',
        type: 'textarea',
        required: true,
        maxLength: 1000,
        placeholder: 'Describe the content structure and flow',
      },
      {
        key: 'metrics',
        label: 'Performance Metrics',
        type: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: 'Completion rate, drop-off points, etc.',
      },
      {
        key: 'duration',
        label: 'Duration',
        type: 'text',
        required: false,
        placeholder: 'e.g., 30 seconds, 2 minutes',
      },
    ],
    outputSections: [
      { key: 'retention_score', title: 'Retention Score', type: 'score', copyable: false },
      { key: 'leak_points', title: 'Leak Points', type: 'object', copyable: true },
      { key: 'overall_pattern', title: 'Overall Pattern', type: 'text', copyable: true },
      { key: 'quick_fixes', title: 'Quick Fixes', type: 'list', copyable: true },
      { key: 'long_term_strategy', title: 'Long-Term Strategy', type: 'text', copyable: true },
    ],
  },
  algorithm_training_mode: {
    toolId: 'algorithm_training_mode',
    title: 'Algorithm Training Mode',
    description: 'Analyze how well your content trains the algorithm.',
    inputFields: [
      {
        key: 'content_description',
        label: 'Content Description',
        type: 'textarea',
        required: true,
        maxLength: 1000,
        placeholder: 'Describe your content',
      },
      {
        key: 'engagement_patterns',
        label: 'Engagement Patterns',
        type: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: 'How people are engaging (likes, comments, saves, shares)',
      },
      {
        key: 'posting_frequency',
        label: 'Posting Frequency',
        type: 'select',
        required: false,
        options: [
          'Multiple times per day',
          'Daily',
          '3-5x per week',
          '1-2x per week',
          'Rarely',
        ],
      },
    ],
    outputSections: [
      { key: 'training_status', title: 'Training Status', type: 'text', copyable: true },
      { key: 'signals_sent', title: 'Signals Sent', type: 'object', copyable: true },
      { key: 'missing_signals', title: 'Missing Signals', type: 'list', copyable: true },
      { key: 'next_post_recommendations', title: 'Next Post Recommendations', type: 'list', copyable: true },
      { key: 'content_pattern_analysis', title: 'Content Pattern Analysis', type: 'text', copyable: true },
    ],
  },
  post_type_recommender: {
    toolId: 'post_type_recommender',
    title: 'Post Type Recommender',
    description: 'Get the exact post type to deploy next based on your growth goal. One recommendation, execution rules, examples.',
    inputFields: [
      {
        key: 'goal',
        label: 'Primary Goal',
        type: 'select',
        required: true,
        options: [
          'reach_discovery',
          'retention',
          'authority',
          'saves',
          'profile_visits',
          'followers',
          'dms_conversions',
        ],
      },
      {
        key: 'account_stage_optional',
        label: 'Account Stage (Optional)',
        type: 'select',
        required: false,
        options: ['new', 'growing', 'established'],
        placeholder: 'Select account stage...',
      },
      {
        key: 'niche_optional',
        label: 'Niche (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., fitness coaching, SaaS, e-commerce',
        maxLength: 100,
      },
      {
        key: 'constraint_optional',
        label: 'Time Constraint (Optional)',
        type: 'select',
        required: false,
        options: ['time_low', 'time_medium', 'time_high'],
        placeholder: 'Select time constraint...',
      },
      {
        key: 'notes_optional',
        label: 'Additional Notes (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Any context about your current content performance or challenges',
        maxLength: 500,
      },
    ],
    outputSections: [
      { key: 'recommended_post_type', title: 'Recommended Post Type', type: 'text', copyable: true },
      { key: 'one_liner', title: 'One Liner', type: 'text', copyable: true },
      { key: 'rules_to_execute', title: 'Rules to Execute', type: 'list', copyable: true },
      { key: 'do_list', title: 'Do', type: 'list', copyable: true },
      { key: 'dont_list', title: "Don't", type: 'list', copyable: true },
      { key: 'hook_examples', title: 'Hook Examples', type: 'list', copyable: true },
      { key: 'caption_examples', title: 'Caption Examples', type: 'list', copyable: true },
      { key: 'soft_cta_suggestions', title: 'Soft CTA Suggestions', type: 'list', copyable: true },
      { key: 'spicy_experiment', title: 'Spicy Experiment', type: 'text', copyable: true },
    ],
  },
}

export function getToolConfig(toolId: ToolId): ToolConfig {
  return toolRegistry[toolId]
}

export function getAllToolIds(): ToolId[] {
  return Object.keys(toolRegistry) as ToolId[]
}
