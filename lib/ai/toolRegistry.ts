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
  post_types_to_outperform: {
    toolId: 'post_types_to_outperform',
    title: 'Post Types To Outperform',
    description: 'Map your growth goal to the exact post type and execution rules that deliver results.',
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
        key: 'industry',
        label: 'Industry (Optional)',
        type: 'select',
        required: false,
        options: [
          'Business Coaching',
          'Fitness & Health',
          'Creative Services',
          'E-commerce',
          'SaaS/Tech',
          'Real Estate',
          'Finance',
          'Education',
          'Other',
        ],
      },
      {
        key: 'weak_points',
        label: 'Current Weak Points (Optional)',
        type: 'text',
        required: false,
        placeholder: 'Comma-separated list',
      },
    ],
    outputSections: [
      { key: 'recommended_post_type', title: 'Recommended Post Type', type: 'text', copyable: true },
      { key: 'post_type_one_liner', title: 'Why This Works', type: 'text', copyable: true },
      { key: 'rules_to_execute', title: 'Rules to Execute', type: 'list', copyable: true },
      { key: 'dos', title: 'Do', type: 'list', copyable: true },
      { key: 'donts', title: "Don't", type: 'list', copyable: true },
      { key: 'hook_examples', title: 'Hook Examples', type: 'list', copyable: true },
      { key: 'caption_examples', title: 'Caption Examples', type: 'list', copyable: true },
      { key: 'cta_suggestions', title: 'CTA Suggestions', type: 'list', copyable: true },
      { key: 'spicy_experiment', title: 'Spicy Experiment', type: 'text', copyable: true },
    ],
  },
  why_post_failed: {
    toolId: 'why_post_failed',
    title: 'Why This Post Failed',
    description: 'Diagnose why a post underperformed and get one focused fix.',
    inputFields: [
      {
        key: 'hook',
        label: 'Hook',
        type: 'textarea',
        required: true,
        maxLength: 200,
        placeholder: 'The first 1-2 seconds of your post',
      },
      {
        key: 'caption',
        label: 'Caption',
        type: 'textarea',
        required: true,
        maxLength: 2000,
        placeholder: 'The full caption',
      },
      {
        key: 'cta',
        label: 'CTA (Optional)',
        type: 'text',
        required: false,
        maxLength: 100,
        placeholder: 'Call-to-action',
      },
      {
        key: 'visual_description',
        label: 'Visual Description',
        type: 'textarea',
        required: true,
        maxLength: 500,
        placeholder: 'Describe the visuals/video',
      },
      {
        key: 'metrics',
        label: 'Performance Metrics',
        type: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: 'Views, engagement rate, saves, etc.',
      },
    ],
    outputSections: [
      { key: 'primary_failure', title: 'Primary Failure', type: 'text', copyable: true },
      { key: 'secondary_issues', title: 'Secondary Issues', type: 'list', copyable: true },
      { key: 'one_fix', title: 'One Fix', type: 'text', copyable: true },
      { key: 'hook_analysis', title: 'Hook Analysis', type: 'object', copyable: true },
      { key: 'caption_analysis', title: 'Caption Analysis', type: 'object', copyable: true },
      { key: 'cta_analysis', title: 'CTA Analysis', type: 'object', copyable: true },
      { key: 'visual_analysis', title: 'Visual Analysis', type: 'object', copyable: true },
      { key: 'next_post_recommendation', title: 'Next Post Recommendation', type: 'text', copyable: true },
    ],
  },
  hook_pressure_test: {
    toolId: 'hook_pressure_test',
    title: 'Hook Pressure Test',
    description: 'Test if your hook will stop the scroll.',
    inputFields: [
      {
        key: 'hook',
        label: 'Hook',
        type: 'textarea',
        required: true,
        maxLength: 200,
        placeholder: 'The hook to test',
      },
      {
        key: 'goal',
        label: 'Goal',
        type: 'select',
        required: true,
        options: [
          'Stop the scroll',
          'Drive profile visits',
          'Generate saves',
          'Encourage comments',
          'Drive DMs',
        ],
      },
      {
        key: 'context',
        label: 'Context (Optional)',
        type: 'textarea',
        required: false,
        maxLength: 300,
        placeholder: 'Additional context about the post',
      },
    ],
    outputSections: [
      { key: 'hook_strength', title: 'Hook Strength', type: 'text', copyable: true },
      { key: 'scroll_stop_power', title: 'Scroll Stop Power', type: 'score', copyable: false },
      { key: 'curiosity_gap', title: 'Curiosity Gap', type: 'text', copyable: true },
      { key: 'issues', title: 'Issues', type: 'list', copyable: true },
      { key: 'improvements', title: 'Improvements', type: 'list', copyable: true },
      { key: 'alternative_hooks', title: 'Alternative Hooks', type: 'list', copyable: true },
      { key: 'recommended_action', title: 'Recommended Action', type: 'text', copyable: true },
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
}

export function getToolConfig(toolId: ToolId): ToolConfig {
  return toolRegistry[toolId]
}

export function getAllToolIds(): ToolId[] {
  return Object.keys(toolRegistry) as ToolId[]
}
