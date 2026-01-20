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
    description: 'Find the single biggest retention leak. Identify the leak. Fix the leak. Ignore everything else.',
    inputFields: [
      {
        key: 'video_length_sec',
        label: 'Video Length (seconds)',
        type: 'number',
        required: true,
        placeholder: 'e.g., 30',
      },
      {
        key: 'avg_watch_time_sec',
        label: 'Average Watch Time (seconds)',
        type: 'number',
        required: true,
        placeholder: 'e.g., 8',
      },
      {
        key: 'retention_points_optional',
        label: 'Retention Points (Optional)',
        type: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: 'A few timestamps showing where viewers drop off. Example: 1s → 80%, 3s → 60%. Helps pinpoint exactly where attention leaks.',
      },
      {
        key: 'known_drop_second_optional',
        label: 'Known Drop Second (Optional)',
        type: 'number',
        required: false,
        placeholder: 'e.g., 5',
      },
      {
        key: 'format_optional',
        label: 'Format (Optional)',
        type: 'select',
        required: false,
        options: ['talking_head', 'text_overlay', 'broll', 'silent'],
        placeholder: 'Select format...',
      },
      {
        key: 'notes_optional',
        label: 'Notes (Optional)',
        type: 'textarea',
        required: false,
        maxLength: 500,
        placeholder: 'Any observations about the video structure',
      },
    ],
    outputSections: [
      { key: 'primary_leak', title: 'Primary Leak', type: 'text', copyable: true },
      { key: 'likely_cause', title: 'Likely Cause', type: 'text', copyable: true },
      { key: 'one_structural_fix', title: 'One Structural Fix', type: 'text', copyable: true },
      { key: 'cut_list', title: 'Cut List', type: 'list', copyable: true },
      { key: 'loop_tweak', title: 'Loop Tweak', type: 'text', copyable: true },
    ],
  },
  algorithm_training_mode: {
    toolId: 'algorithm_training_mode',
    title: 'Algorithm Training Mode',
    description: 'Design a short-term posting sequence that intentionally trains the algorithm. Think in SYSTEMS, not virality.',
    inputFields: [
      {
        key: 'training_goal',
        label: 'Training Goal',
        type: 'select',
        required: true,
        options: ['audience', 'topic', 'format'],
      },
      {
        key: 'target_audience',
        label: 'Target Audience',
        type: 'text',
        required: true,
        placeholder: 'e.g., fitness coaches, SaaS founders, e-commerce owners',
        maxLength: 100,
      },
      {
        key: 'core_topic',
        label: 'Core Topic',
        type: 'text',
        required: true,
        placeholder: 'e.g., Instagram strategy, productivity systems, sales psychology',
        maxLength: 100,
      },
      {
        key: 'preferred_format',
        label: 'Preferred Format',
        type: 'select',
        required: true,
        options: ['reels_only', 'mixed'],
      },
      {
        key: 'days',
        label: 'Training Duration',
        type: 'select',
        required: true,
        options: ['7', '10', '14'],
      },
      {
        key: 'posting_capacity',
        label: 'Posting Capacity',
        type: 'select',
        required: true,
        options: ['low', 'medium', 'high'],
      },
    ],
    outputSections: [
      { key: 'training_thesis', title: 'Training Thesis', type: 'text', copyable: true },
      { key: 'sequence', title: 'Training Sequence', type: 'object', copyable: true },
      { key: 'guardrails', title: 'Guardrails', type: 'list', copyable: true },
      { key: 'one_spicy_experiment', title: 'One Spicy Experiment', type: 'text', copyable: true },
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
  cta_match_checker: {
    toolId: 'cta_match_checker',
    title: 'CTA Match Checker',
    description: 'Evaluate whether your CTA matches what the viewer is ready to do RIGHT NOW. One verdict. One best action.',
    inputFields: [
      {
        key: 'post_goal',
        label: 'Post Goal',
        type: 'select',
        required: true,
        options: ['reach', 'retention', 'authority', 'saves', 'profile_visits', 'followers', 'dms'],
      },
      {
        key: 'current_cta_text',
        label: 'Current CTA Text',
        type: 'textarea',
        required: true,
        maxLength: 200,
        placeholder: 'Paste your current CTA here',
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
        key: 'audience_temperature_optional',
        label: 'Audience Temperature (Optional)',
        type: 'select',
        required: false,
        options: ['cold', 'warm', 'hot'],
        placeholder: 'Select temperature...',
      },
    ],
    outputSections: [
      { key: 'match_verdict', title: 'Match Verdict', type: 'text', copyable: true },
      { key: 'why_short', title: 'Why', type: 'text', copyable: true },
      { key: 'best_single_action', title: 'Best Single Action', type: 'text', copyable: true },
      { key: 'rewritten_ctas', title: 'Rewritten CTAs', type: 'list', copyable: true },
      { key: 'placement_instruction', title: 'Placement Instruction', type: 'text', copyable: true },
    ],
  },
  follower_quality_filter: {
    toolId: 'follower_quality_filter',
    title: 'Follower Quality Filter',
    description: 'Sharpen positioning to attract the ideal follower and repel the wrong audience.',
    inputFields: [
      {
        key: 'ideal_follower_one_liner',
        label: 'Ideal Follower (One Liner)',
        type: 'textarea',
        required: true,
        maxLength: 200,
        placeholder: 'e.g., "Fitness coaches who want to scale without burnout"',
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
        key: 'current_problem_optional',
        label: 'Current Problem (Optional)',
        type: 'select',
        required: false,
        options: ['wrong_audience', 'low_engagement', 'no_dms'],
        placeholder: 'Select problem...',
      },
    ],
    outputSections: [
      { key: 'positioning_sentence', title: 'Positioning Sentence', type: 'text', copyable: true },
      { key: 'language_to_use', title: 'Language to Use', type: 'list', copyable: true },
      { key: 'language_to_avoid', title: 'Language to Avoid', type: 'list', copyable: true },
      { key: 'post_types_to_attract', title: 'Post Types to Attract', type: 'list', copyable: true },
      { key: 'post_types_to_repel', title: 'Post Types to Repel', type: 'list', copyable: true },
      { key: 'bio_line_optional', title: 'Bio Line (Optional)', type: 'text', copyable: true },
    ],
  },
  content_system_builder: {
    toolId: 'content_system_builder',
    title: 'Content System Builder',
    description: 'Build a repeatable weekly content system aligned to your goal and capacity.',
    inputFields: [
      {
        key: 'primary_goal',
        label: 'Primary Goal',
        type: 'select',
        required: true,
        options: ['reach', 'retention', 'authority', 'saves', 'followers', 'dms'],
      },
      {
        key: 'posting_days_per_week',
        label: 'Posting Days Per Week',
        type: 'select',
        required: true,
        options: ['1', '2', '3', '4', '5', '6', '7'],
      },
      {
        key: 'time_per_post',
        label: 'Time Per Post',
        type: 'select',
        required: true,
        options: ['low', 'medium', 'high'],
      },
      {
        key: 'strengths_optional',
        label: 'Strengths (Optional)',
        type: 'select',
        required: false,
        options: ['writing', 'speaking', 'editing', 'design'],
        placeholder: 'Select strength...',
      },
      {
        key: 'niche',
        label: 'Niche',
        type: 'text',
        required: true,
        placeholder: 'e.g., fitness coaching, SaaS, e-commerce',
        maxLength: 100,
      },
    ],
    outputSections: [
      { key: 'system_name', title: 'System Name', type: 'text', copyable: true },
      { key: 'weekly_plan', title: 'Weekly Plan', type: 'object', copyable: true },
      { key: 'nonnegotiables', title: 'Nonnegotiables', type: 'list', copyable: true },
      { key: 'templates', title: 'Templates', type: 'object', copyable: true },
    ],
  },
  what_to_stop_posting: {
    toolId: 'what_to_stop_posting',
    title: 'What to Stop Posting',
    description: 'Spot what\'s dragging your performance down — and what to post instead.',
    inputFields: [
      {
        key: 'recent_posts_summary',
        label: 'Recent Posts Summary',
        type: 'textarea',
        required: true,
        maxLength: 2000,
        placeholder: 'Example:\nPattern-Breaker — Reach — low views\nFramework — Saves — lots of saves\nCalm Insight — Retention — drop at 3 seconds\nBefore/After — Profile visits — decent taps, no follows',
      },
      {
        key: 'recurring_issues_optional',
        label: 'Recurring Issues (Optional)',
        type: 'select',
        required: false,
        options: ['Low reach', 'Low retention', 'No saves', 'No DMs'],
        placeholder: 'Choose the main issue (optional)',
      },
      {
        key: 'niche_optional',
        label: 'Niche (Optional)',
        type: 'text',
        required: false,
        placeholder: 'Example: fitness coaching, SaaS, e-commerce',
        maxLength: 100,
      },
    ],
    outputSections: [
      { key: 'stop_list', title: 'Stop List', type: 'object', copyable: true },
      { key: 'keep_list', title: 'Keep List', type: 'list', copyable: true },
      { key: 'one_rule_to_enforce', title: 'One Rule to Enforce', type: 'text', copyable: true },
    ],
  },
  controlled_experiment_planner: {
    toolId: 'controlled_experiment_planner',
    title: 'Controlled Experiment Planner',
    description: 'Design clean tests that isolate one variable and produce reliable learning.',
    inputFields: [
      {
        key: 'objective',
        label: 'Objective',
        type: 'select',
        required: true,
        options: ['increase_retention', 'increase_saves', 'increase_follows', 'increase_dms'],
      },
      {
        key: 'baseline_description',
        label: 'Baseline Description',
        type: 'textarea',
        required: true,
        maxLength: 500,
        placeholder: 'Describe your current baseline performance',
      },
      {
        key: 'variable_options_optional',
        label: 'Variable Options (Optional)',
        type: 'select',
        required: false,
        options: ['hook', 'pacing', 'visual_style', 'cta', 'post_type'],
        placeholder: 'Select variable...',
      },
      {
        key: 'duration_days',
        label: 'Duration (Days)',
        type: 'select',
        required: true,
        options: ['3', '5', '7', '10'],
      },
      {
        key: 'posting_count',
        label: 'Posting Count',
        type: 'number',
        required: true,
        placeholder: 'e.g., 5',
      },
    ],
    outputSections: [
      { key: 'hypothesis', title: 'Hypothesis', type: 'text', copyable: true },
      { key: 'control_definition', title: 'Control Definition', type: 'text', copyable: true },
      { key: 'variable_to_change', title: 'Variable to Change', type: 'text', copyable: true },
      { key: 'test_matrix', title: 'Test Matrix', type: 'object', copyable: true },
      { key: 'success_metric', title: 'Success Metric', type: 'text', copyable: true },
      { key: 'decision_rule', title: 'Decision Rule', type: 'text', copyable: true },
    ],
  },
}

export function getToolConfig(toolId: ToolId): ToolConfig {
  return toolRegistry[toolId]
}

export function getAllToolIds(): ToolId[] {
  return Object.keys(toolRegistry) as ToolId[]
}
