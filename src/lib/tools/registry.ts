export type PlanId = 'free' | 'pro_monthly' | 'team' | 'lifetime'

export type ToolFieldType =
  | 'shortText'
  | 'longText'
  | 'number'
  | 'select'
  | 'multiSelect'
  | 'toggle'

export type ToolField = {
  key: string
  label: string
  type: ToolFieldType
  required?: boolean
  placeholder?: string
  help?: string
  min?: number
  max?: number
  step?: number
  options?: { label: string; value: string }[]
  defaultValue?: any
}

export type ToolCategory =
  | 'Hooks'
  | 'Reels'
  | 'DMs'
  | 'Content'
  | 'Offers'
  | 'Analytics'
  | 'Positioning'
  | 'Operations'

export type ToolMeta = {
  id: string
  name: string
  description: string
  category: ToolCategory
  icon: string
  badge?: 'Free' | 'Pro' | 'Team' | 'New'
  isPublic?: boolean
  aiLevel: 'none' | 'light' | 'heavy'
  tokensPerRun: number
  dailyRunsByPlan: Record<PlanId, number>
  fields: ToolField[]
}

// 👇 Canonical 20 tool IDs (must match runnerRegistry keys)
export const EXPECTED_TOOL_IDS: string[] = [
  'hook-analyzer',
  'cta-match-analyzer',
  'dm-intelligence-engine',
  'retention-leak-finder',
  'reel-script-builder',
  'offer-clarity-check',
  'positioning-knife',
  'content-repurpose-machine',
  'comment-magnet',
  'profile-clarity-scan',
  'bio-to-cta',
  'carousel-blueprint',
  'story-sequence-planner',
  'hashtag-support-pack',
  'competitor-lunch-money',
  'analytics-signal-reader',
  'audience-mirror',
  'objection-crusher',
  'launch-plan-sprinter',
  'content-calendar-minimal',
]

export const TOOL_REGISTRY: Record<string, ToolMeta> = {
  'hook-analyzer': {
    id: 'hook-analyzer',
    name: 'Hook Analyzer',
    description: 'Scores your hook and suggests punchier alternates.',
    category: 'Hooks',
    icon: 'Zap',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [
      {
        key: 'hook',
        label: 'Hook',
        type: 'shortText',
        required: true,
        placeholder: 'e.g., "Stop posting Reels like this..."',
        help: 'Keep it under ~12 words when possible.',
      },
      {
        key: 'audience',
        label: 'Audience',
        type: 'shortText',
        required: false,
        placeholder: 'e.g., new digital marketers, coaches, creators',
      },
      {
        key: 'format',
        label: 'Format',
        type: 'select',
        required: false,
        options: [
          { label: 'Reel', value: 'reel' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Story', value: 'story' },
        ],
        defaultValue: 'reel',
      },
    ],
  },

  'cta-match-analyzer': {
    id: 'cta-match-analyzer',
    name: 'CTA Match Analyzer',
    description: 'Checks if your CTA actually fits your content + offer.',
    category: 'Offers',
    icon: 'Target',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [
      { key: 'contentSummary', label: 'Content summary', type: 'longText', required: true },
      {
        key: 'cta',
        label: 'CTA used',
        type: 'shortText',
        required: true,
        placeholder: 'e.g., "DM me PLAN"',
      },
      {
        key: 'offerType',
        label: 'Offer type',
        type: 'select',
        required: true,
        options: [
          { label: 'Lead magnet', value: 'lead_magnet' },
          { label: 'Consult / call', value: 'call' },
          { label: 'Course', value: 'course' },
          { label: 'Service', value: 'service' },
          { label: 'Product', value: 'product' },
        ],
      },
    ],
  },

  'dm-intelligence-engine': {
    id: 'dm-intelligence-engine',
    name: 'DM Intelligence Engine',
    description: 'Turns messy DMs into clean, confident replies that convert.',
    category: 'DMs',
    icon: 'MessageCircle',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 4,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'leadMessage', label: 'Their message', type: 'longText', required: true },
      {
        key: 'goal',
        label: 'Your goal',
        type: 'select',
        required: true,
        options: [
          { label: 'Qualify', value: 'qualify' },
          { label: 'Book call', value: 'book_call' },
          { label: 'Close sale', value: 'close' },
          { label: 'Handle objection', value: 'objection' },
        ],
      },
      {
        key: 'tone',
        label: 'Tone',
        type: 'select',
        required: false,
        options: [
          { label: 'Calm confident', value: 'calm' },
          { label: 'Friendly', value: 'friendly' },
          { label: 'Direct', value: 'direct' },
        ],
        defaultValue: 'calm',
      },
      {
        key: 'offerOneLiner',
        label: 'Offer one-liner',
        type: 'shortText',
        required: false,
        placeholder: 'e.g., "I help new marketers build Reels that convert."',
      },
    ],
  },

  'retention-leak-finder': {
    id: 'retention-leak-finder',
    name: 'Retention Leak Finder',
    description: 'Finds where your Reel loses people and how to patch it.',
    category: 'Analytics',
    icon: 'Activity',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 4,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'reelScript', label: 'Reel script / outline', type: 'longText', required: true },
      {
        key: 'lengthSeconds',
        label: 'Length (seconds)',
        type: 'number',
        required: false,
        min: 3,
        max: 180,
        step: 1,
      },
      {
        key: 'targetAction',
        label: 'Target action',
        type: 'select',
        required: false,
        options: [
          { label: 'Save', value: 'save' },
          { label: 'Follow', value: 'follow' },
          { label: 'DM', value: 'dm' },
          { label: 'Click', value: 'click' },
        ],
        defaultValue: 'save',
      },
    ],
  },

  'reel-script-builder': {
    id: 'reel-script-builder',
    name: 'Reel Script Builder',
    description: 'One idea. Tight script. Built for rewatches.',
    category: 'Reels',
    icon: 'Clapperboard',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [
      { key: 'topic', label: 'Topic', type: 'shortText', required: true },
      {
        key: 'angle',
        label: 'Angle',
        type: 'select',
        required: false,
        options: [
          { label: 'Contrarian take', value: 'contrarian' },
          { label: 'Nobody tells you this', value: 'nobody' },
          { label: 'Simple truth', value: 'truth' },
          { label: 'Before/after shift', value: 'before_after' },
        ],
        defaultValue: 'truth',
      },
      {
        key: 'lengthSeconds',
        label: 'Length (seconds)',
        type: 'number',
        required: false,
        min: 6,
        max: 60,
        step: 1,
        defaultValue: 15,
      },
    ],
  },

  'offer-clarity-check': {
    id: 'offer-clarity-check',
    name: 'Offer Clarity Check',
    description: 'Makes your offer understandable in one breath.',
    category: 'Offers',
    icon: 'BadgeCheck',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 3,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'offer', label: 'Offer description', type: 'longText', required: true },
      { key: 'audience', label: "Who it's for", type: 'shortText', required: true },
      { key: 'price', label: 'Price (optional)', type: 'shortText', required: false },
    ],
  },

  'positioning-knife': {
    id: 'positioning-knife',
    name: 'Positioning Knife',
    description: 'Slices your positioning down to what actually matters.',
    category: 'Positioning',
    icon: 'Scissors',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 3,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'whatYouDo', label: 'What you do', type: 'longText', required: true },
      { key: 'whoFor', label: "Who it's for", type: 'shortText', required: true },
      { key: 'proof', label: 'Proof / results', type: 'longText', required: false },
    ],
  },

  'content-repurpose-machine': {
    id: 'content-repurpose-machine',
    name: 'Content Repurpose Machine',
    description: 'Turns one idea into multiple post formats.',
    category: 'Content',
    icon: 'Repeat2',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [
      { key: 'source', label: 'Source content', type: 'longText', required: true },
      {
        key: 'outputs',
        label: 'Outputs',
        type: 'multiSelect',
        required: true,
        options: [
          { label: 'Reel ideas', value: 'reels' },
          { label: 'Carousel outline', value: 'carousel' },
          { label: 'Story sequence', value: 'stories' },
          { label: 'Caption bank', value: 'captions' },
        ],
        defaultValue: ['reels', 'carousel'],
      },
    ],
  },

  'comment-magnet': {
    id: 'comment-magnet',
    name: 'Comment Magnet',
    description: 'Generates questions that spark real replies (not "fire").',
    category: 'Content',
    icon: 'MessagesSquare',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [{ key: 'postTopic', label: 'Post topic', type: 'shortText', required: true }],
  },

  'profile-clarity-scan': {
    id: 'profile-clarity-scan',
    name: 'Profile Clarity Scan',
    description: "Checks if your profile explains who it's for in 3 seconds.",
    category: 'Positioning',
    icon: 'UserSearch',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [
      { key: 'bio', label: 'Current bio', type: 'longText', required: true },
      { key: 'link', label: 'Link destination', type: 'shortText', required: false },
      { key: 'offer', label: 'Primary offer', type: 'shortText', required: false },
    ],
  },

  'bio-to-cta': {
    id: 'bio-to-cta',
    name: 'Bio to CTA',
    description: 'Turns your bio into a clean CTA that does not beg.',
    category: 'Positioning',
    icon: 'Link',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [{ key: 'bio', label: 'Bio', type: 'longText', required: true }],
  },

  'carousel-blueprint': {
    id: 'carousel-blueprint',
    name: 'Carousel Blueprint',
    description: 'Slide-by-slide carousel outline that is built for saves.',
    category: 'Content',
    icon: 'PanelsTopLeft',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 3,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'topic', label: 'Topic', type: 'shortText', required: true },
      {
        key: 'slides',
        label: 'Slide count',
        type: 'number',
        required: false,
        min: 5,
        max: 12,
        step: 1,
        defaultValue: 8,
      },
    ],
  },

  'story-sequence-planner': {
    id: 'story-sequence-planner',
    name: 'Story Sequence Planner',
    description: 'A story arc that feels natural and moves people to action.',
    category: 'Content',
    icon: 'Film',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 3,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'goal', label: 'Goal', type: 'shortText', required: true },
      { key: 'context', label: 'Context', type: 'longText', required: false },
    ],
  },

  'hashtag-support-pack': {
    id: 'hashtag-support-pack',
    name: 'Hashtag Support Pack',
    description: 'Supportive hashtags (not the main character).',
    category: 'Operations',
    icon: 'Hash',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'light',
    tokensPerRun: 1,
    dailyRunsByPlan: { free: 10, pro_monthly: 100, team: 200, lifetime: 300 },
    fields: [
      { key: 'topic', label: 'Topic', type: 'shortText', required: true },
      { key: 'niche', label: 'Niche', type: 'shortText', required: false },
    ],
  },

  'competitor-lunch-money': {
    id: 'competitor-lunch-money',
    name: 'Competitor Lunch Money',
    description: 'Reverse-engineers a competitor into a better content plan.',
    category: 'Analytics',
    icon: 'Crosshair',
    badge: 'Team',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 5,
    dailyRunsByPlan: { free: 0, pro_monthly: 10, team: 40, lifetime: 80 },
    fields: [
      { key: 'competitorHandle', label: 'Competitor handle', type: 'shortText', required: true },
      { key: 'yourAngle', label: 'Your advantage', type: 'shortText', required: false },
    ],
  },

  'analytics-signal-reader': {
    id: 'analytics-signal-reader',
    name: 'Analytics Signal Reader',
    description: 'Turns your IG numbers into clear next actions.',
    category: 'Analytics',
    icon: 'LineChart',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 4,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'last30', label: 'Last 30 days metrics (paste)', type: 'longText', required: true },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        required: false,
        options: [
          { label: 'Followers', value: 'followers' },
          { label: 'Leads/DMs', value: 'leads' },
          { label: 'Sales', value: 'sales' },
          { label: 'Watch time', value: 'watch_time' },
        ],
        defaultValue: 'watch_time',
      },
    ],
  },

  'audience-mirror': {
    id: 'audience-mirror',
    name: 'Audience Mirror',
    description: 'Turns vague audience into specific pains and language.',
    category: 'Positioning',
    icon: 'Users',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [{ key: 'audience', label: 'Audience', type: 'shortText', required: true }],
  },

  'objection-crusher': {
    id: 'objection-crusher',
    name: 'Objection Crusher',
    description: 'Replies to objections without sounding defensive or salesy.',
    category: 'DMs',
    icon: 'Shield',
    badge: 'Pro',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 4,
    dailyRunsByPlan: { free: 0, pro_monthly: 30, team: 80, lifetime: 150 },
    fields: [
      { key: 'objection', label: 'Objection', type: 'longText', required: true },
      { key: 'offer', label: 'Your offer', type: 'shortText', required: false },
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        required: false,
        options: [
          { label: 'DM', value: 'dm' },
          { label: 'Comment', value: 'comment' },
          { label: 'Caption', value: 'caption' },
        ],
        defaultValue: 'dm',
      },
    ],
  },

  'launch-plan-sprinter': {
    id: 'launch-plan-sprinter',
    name: 'Launch Plan Sprinter',
    description: 'A tight, realistic launch plan.',
    category: 'Operations',
    icon: 'Rocket',
    badge: 'Team',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 5,
    dailyRunsByPlan: { free: 0, pro_monthly: 10, team: 40, lifetime: 80 },
    fields: [
      { key: 'offer', label: 'Offer', type: 'longText', required: true },
      {
        key: 'timeframe',
        label: 'Timeframe',
        type: 'select',
        required: true,
        options: [
          { label: '3 days', value: '3d' },
          { label: '7 days', value: '7d' },
          { label: '14 days', value: '14d' },
        ],
      },
    ],
  },

  'content-calendar-minimal': {
    id: 'content-calendar-minimal',
    name: 'Content Calendar Minimal',
    description: "Simple calendar that you'll actually follow.",
    category: 'Operations',
    icon: 'CalendarDays',
    badge: 'Free',
    isPublic: true,
    aiLevel: 'heavy',
    tokensPerRun: 2,
    dailyRunsByPlan: { free: 5, pro_monthly: 50, team: 100, lifetime: 200 },
    fields: [
      { key: 'topicPillars', label: 'Topic pillars (comma separated)', type: 'shortText', required: true },
      {
        key: 'postsPerWeek',
        label: 'Posts per week',
        type: 'number',
        required: false,
        min: 1,
        max: 14,
        step: 1,
        defaultValue: 5,
      },
    ],
  },
}

function assertExactToolIds() {
  const registryIds = Object.keys(TOOL_REGISTRY)
  const expected = EXPECTED_TOOL_IDS

  const missing = expected.filter((id) => !registryIds.includes(id))
  const extra = registryIds.filter((id) => !expected.includes(id))

  const dupExpected = expected.filter((id, idx) => expected.indexOf(id) !== idx)
  const dupRegistry = registryIds.filter((id, idx) => registryIds.indexOf(id) !== idx)

  if (dupExpected.length || dupRegistry.length || missing.length || extra.length) {
    throw new Error(
      [
        'TOOL_REGISTRY IDs are NOT aligned with EXPECTED_TOOL_IDS.',
        dupExpected.length ? `Duplicate EXPECTED_TOOL_IDS: ${dupExpected.join(', ')}` : null,
        dupRegistry.length ? `Duplicate TOOL_REGISTRY keys: ${dupRegistry.join(', ')}` : null,
        missing.length ? `Missing in TOOL_REGISTRY: ${missing.join(', ')}` : null,
        extra.length ? `Extra in TOOL_REGISTRY: ${extra.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    )
  }
}

assertExactToolIds()

export function getToolMeta(toolId: string): ToolMeta {
  const tool = TOOL_REGISTRY[toolId]
  if (!tool) throw new Error(`Unknown toolId: ${toolId}`)
  return tool
}

export function listTools(): ToolMeta[] {
  return EXPECTED_TOOL_IDS.map((id) => getToolMeta(id))
}
