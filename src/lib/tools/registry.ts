// src/lib/tools/registry.ts
import { z } from 'zod'

export type PlanId = 'free' | 'pro_monthly' | 'team' | 'lifetime'
export type AiLevel = 'none' | 'light' | 'heavy'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type ToolCategory = 'Hooks' | 'Content' | 'DMs' | 'Offers' | 'Analytics' | 'Audience' | 'Competitive'

export type ToolFieldType = 'shortText' | 'longText' | 'number' | 'select' | 'multiSelect' | 'toggle'

export type ToolFieldOption = { label: string; value: string }

export type ToolField = {
  key: string
  label: string
  type: ToolFieldType
  required?: boolean
  placeholder?: string
  help?: string

  // number
  min?: number
  max?: number
  step?: number

  // select/multiSelect
  options?: ToolFieldOption[]

  // defaults
  defaultValue?: any
}

export type ToolExample = {
  label: string
  input: Record<string, any>
}

export type ToolMicrocopy = {
  oneLiner?: string
  whoFor?: string[]
  youInput?: string[]
  youGet?: string[]
  notes?: string[]
}

export type ToolMeta = {
  id: string
  name: string
  description: string

  // ✅ requested upgrades
  enabled: boolean
  isPublic: boolean
  category: ToolCategory
  tags: string[]
  difficulty: Difficulty
  examples: ToolExample[]
  planEntitlements: Record<PlanId, boolean>

  // enforcement + UX
  aiLevel: AiLevel
  tokensPerRun: number
  dailyRunsByPlan: Record<PlanId, number>

  // UI driven inputs
  fields: ToolField[]

  // Optional (supported by validate.ts if you choose to add later)
  inputSchema?: z.ZodTypeAny

  // Optional (nice to have, not required)
  outputSchemaLabel?: string
  outputHints?: string[]
  microcopy?: ToolMicrocopy
}

export const EXPECTED_TOOL_IDS = [
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
] as const

export type ToolId = (typeof EXPECTED_TOOL_IDS)[number]

const TAG_CATEGORY_RULES: Record<string, ToolCategory> = {
  // Hooks
  hook: 'Hooks',
  hooks: 'Hooks',
  opener: 'Hooks',

  // Content
  caption: 'Content',
  reel: 'Content',
  script: 'Content',
  carousel: 'Content',
  story: 'Content',
  hashtag: 'Content',

  // DMs
  dm: 'DMs',
  outreach: 'DMs',
  conversation: 'DMs',

  // Offers
  offer: 'Offers',
  cta: 'Offers',
  pricing: 'Offers',

  // Analytics
  retention: 'Analytics',
  engagement: 'Analytics',
  performance: 'Analytics',

  // Audience
  audience: 'Audience',
  niche: 'Audience',
  persona: 'Audience',

  // Competitive
  competitor: 'Competitive',
  positioning: 'Competitive',
  angle: 'Competitive',
}

const planEntitlementsAll: Record<PlanId, boolean> = {
  free: true,
  pro_monthly: true,
  team: true,
  lifetime: true,
}

const planEntitlementsPaid: Record<PlanId, boolean> = {
  free: false,
  pro_monthly: true,
  team: true,
  lifetime: true,
}

const dailyRunsDefault: Record<PlanId, number> = {
  free: 0,
  pro_monthly: 9999,
  team: 9999,
  lifetime: 9999,
}

const dailyRunsFreeTrialOnly: Record<PlanId, number> = {
  free: 0,
  pro_monthly: 50,
  team: 100,
  lifetime: 200,
}

type ToolMetaSeed = Omit<ToolMeta, 'category'>

const normalizeTag = (tag: string) => tag.trim().toLowerCase()

const deriveCategoryFromTags = (tags: string[]): ToolCategory => {
  for (const raw of tags) {
    const normalized = normalizeTag(raw)
    if (TAG_CATEGORY_RULES[normalized]) return TAG_CATEGORY_RULES[normalized]
    if (normalized.endsWith('s')) {
      const singular = normalized.slice(0, -1)
      if (TAG_CATEGORY_RULES[singular]) return TAG_CATEGORY_RULES[singular]
    }
  }
  return 'Content'
}

const TOOL_REGISTRY_SEED: Record<ToolId, ToolMetaSeed> = {
  'hook-analyzer': {
    id: 'hook-analyzer',
    name: 'Hook Analyzer',
    description: 'Score a hook and generate stronger variations.',
    enabled: true,
    isPublic: true,
    tags: ['hooks', 'reels', 'retention'],
    difficulty: 'easy',
    examples: [
      {
        label: 'Contrarian marketing hook',
        input: {
          hook: 'Stop posting “value” content. It’s killing your growth.',
          audience: 'new digital marketers (18–35)',
          format: 'reel',
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 15,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 50,
      team: 100,
      lifetime: 200,
    },
    fields: [
      {
        key: 'hook',
        label: 'Hook',
        type: 'shortText',
        required: true,
        placeholder: 'Type your first line…',
        help: 'First 1–1.5 seconds. No intros.',
      },
      {
        key: 'audience',
        label: 'Audience',
        type: 'shortText',
        required: false,
        placeholder: 'Who is this for?',
      },
      {
        key: 'format',
        label: 'Format',
        type: 'select',
        required: false,
        defaultValue: 'reel',
        options: [
          { label: 'Reel', value: 'reel' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Story', value: 'story' },
          { label: 'YouTube Short', value: 'short' },
        ],
      },
    ],
  },

  'cta-match-analyzer': {
    id: 'cta-match-analyzer',
    name: 'CTA Match Analyzer',
    description: 'Check if your CTA actually matches what the content promised.',
    enabled: true,
    isPublic: true,
    tags: ['conversion', 'cta', 'offers'],
    difficulty: 'easy',
    examples: [
      {
        label: 'CTA mismatch fix',
        input: {
          contentSummary: 'Explains why inconsistent posting kills reach and what to do instead.',
          offerType: 'free lead magnet',
          cta: 'Book a $5,000/month retainer call',
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 15,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 50,
      team: 100,
      lifetime: 200,
    },
    fields: [
      {
        key: 'contentSummary',
        label: 'Content summary',
        type: 'longText',
        required: true,
        placeholder: 'What did the post actually say?',
      },
      {
        key: 'offerType',
        label: 'Offer type',
        type: 'select',
        required: true,
        defaultValue: 'dm',
        options: [
          { label: 'DM invite', value: 'dm' },
          { label: 'Free lead magnet', value: 'lead_magnet' },
          { label: 'Paid product', value: 'paid_product' },
          { label: 'Call booking', value: 'call' },
          { label: 'Newsletter', value: 'newsletter' },
        ],
      },
      {
        key: 'cta',
        label: 'CTA',
        type: 'shortText',
        required: true,
        placeholder: 'e.g., “DM me the word…”',
      },
    ],
  },

  'dm-intelligence-engine': {
    id: 'dm-intelligence-engine',
    name: 'DM Intelligence Engine',
    description: 'Score intent and generate the best next message (non-cringe).',
    enabled: true,
    isPublic: true,
    tags: ['dm', 'conversion', 'sales'],
    difficulty: 'medium',
    examples: [
      {
        label: 'Warm lead reply',
        input: {
          leadMessage: 'How much is it and what do I get?',
          goal: 'close',
          tone: 'calm',
          offerOneLiner: 'I help new marketers build a simple reels system that turns views into DMs.',
        },
      },
    ],
    planEntitlements: planEntitlementsPaid,
    aiLevel: 'heavy',
    tokensPerRun: 35,
    dailyRunsByPlan: dailyRunsDefault,
    fields: [
      { key: 'leadMessage', label: 'Their message', type: 'longText', required: true, placeholder: 'Paste the DM…' },
      {
        key: 'goal',
        label: 'Goal',
        type: 'select',
        required: true,
        defaultValue: 'clarify',
        options: [
          { label: 'Clarify', value: 'clarify' },
          { label: 'Close', value: 'close' },
          { label: 'Qualify', value: 'qualify' },
          { label: 'Revive convo', value: 'revive' },
        ],
      },
      {
        key: 'tone',
        label: 'Tone',
        type: 'select',
        required: true,
        defaultValue: 'calm',
        options: [
          { label: 'Calm', value: 'calm' },
          { label: 'Direct', value: 'direct' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
      },
      { key: 'offerOneLiner', label: 'Offer one-liner', type: 'shortText', required: false, placeholder: 'Optional' },
    ],
  },

  'retention-leak-finder': {
    id: 'retention-leak-finder',
    name: 'Retention Leak Finder',
    description: 'Find where your script loses people and patch the leaks.',
    enabled: true,
    isPublic: true,
    tags: ['retention', 'reels', 'scripts'],
    difficulty: 'medium',
    examples: [
      {
        label: 'Fix a boring script',
        input: {
          reelScript:
            'Today I want to talk about consistency on Instagram. Consistency is important because… (long intro)…',
          lengthSeconds: 20,
          targetAction: 'save',
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 18,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'reelScript', label: 'Script / outline', type: 'longText', required: true, placeholder: 'Paste it…' },
      {
        key: 'lengthSeconds',
        label: 'Length (seconds)',
        type: 'number',
        required: false,
        min: 5,
        max: 120,
        step: 1,
        placeholder: 'e.g., 20',
      },
      {
        key: 'targetAction',
        label: 'Target action',
        type: 'select',
        required: true,
        defaultValue: 'save',
        options: [
          { label: 'Save', value: 'save' },
          { label: 'Follow', value: 'follow' },
          { label: 'DM', value: 'dm' },
          { label: 'Click link', value: 'click' },
        ],
      },
    ],
  },

  'reel-script-builder': {
    id: 'reel-script-builder',
    name: 'Reel Script Builder',
    description: 'Generate a retention-first Reel with a loop ending.',
    enabled: true,
    isPublic: true,
    tags: ['reels', 'scripts', 'retention'],
    difficulty: 'easy',
    examples: [
      {
        label: 'One idea, clean loop',
        input: {
          topic: 'Why “more content” isn’t the answer',
          angle: 'contrarian',
          lengthSeconds: 15,
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'heavy',
    tokensPerRun: 30,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 20,
      team: 50,
      lifetime: 100,
    },
    fields: [
      { key: 'topic', label: 'Topic', type: 'shortText', required: true, placeholder: 'One clear idea…' },
      {
        key: 'angle',
        label: 'Angle',
        type: 'select',
        required: true,
        defaultValue: 'practical',
        options: [
          { label: 'Practical', value: 'practical' },
          { label: 'Contrarian', value: 'contrarian' },
          { label: 'Curiosity', value: 'curiosity' },
          { label: 'Authority', value: 'authority' },
          { label: 'Story', value: 'story' },
        ],
      },
      {
        key: 'lengthSeconds',
        label: 'Target length (seconds)',
        type: 'number',
        required: true,
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
    description: 'Turn a messy offer into something people instantly understand.',
    enabled: true,
    isPublic: true,
    tags: ['offers', 'positioning', 'conversion'],
    difficulty: 'medium',
    examples: [
      {
        label: 'Messy offer → clean',
        input: {
          offer:
            'I help creators grow using a mix of mindset, content strategy, and DM scripts plus coaching calls and templates…',
          audience: 'new digital product marketers',
          price: '$49',
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'heavy',
    tokensPerRun: 30,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'offer', label: 'Offer (raw)', type: 'longText', required: true, placeholder: 'Paste your messy offer…' },
      { key: 'audience', label: 'Audience', type: 'shortText', required: true, placeholder: 'Who is it for?' },
      { key: 'price', label: 'Price (optional)', type: 'shortText', required: false, placeholder: '$49 / $499 / etc.' },
    ],
  },

  'positioning-knife': {
    id: 'positioning-knife',
    name: 'Positioning Knife',
    description: 'Cut the fluff, sharpen differentiation, produce a clean positioning statement.',
    enabled: true,
    isPublic: true,
    tags: ['positioning', 'branding', 'offers'],
    difficulty: 'hard',
    examples: [
      {
        label: 'Sharper positioning',
        input: {
          whatYouDo: 'I help coaches grow on Instagram',
          whoFor: 'new coaches selling under $500 offers',
          proof: 'helped 30+ creators get their first 1,000 followers',
        },
      },
    ],
    planEntitlements: planEntitlementsPaid,
    aiLevel: 'heavy',
    tokensPerRun: 35,
    dailyRunsByPlan: dailyRunsDefault,
    fields: [
      { key: 'whatYouDo', label: 'What you do', type: 'shortText', required: true },
      { key: 'whoFor', label: 'Who it’s for', type: 'shortText', required: true },
      { key: 'proof', label: 'Proof (optional)', type: 'longText', required: false },
    ],
  },

  'content-repurpose-machine': {
    id: 'content-repurpose-machine',
    name: 'Content Repurpose Machine',
    description: 'Turn one idea into Reels, carousel, stories, and caption options.',
    enabled: true,
    isPublic: true,
    tags: ['repurpose', 'content', 'system'],
    difficulty: 'easy',
    examples: [
      {
        label: 'Repurpose a single insight',
        input: {
          source: 'Most people post to impress. Post to be understood.',
          outputs: ['reels', 'carousel', 'stories', 'captions'],
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 20,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'source', label: 'Source content', type: 'longText', required: true, placeholder: 'Paste an idea / post…' },
      {
        key: 'outputs',
        label: 'Outputs',
        type: 'multiSelect',
        required: false,
        options: [
          { label: 'Reels', value: 'reels' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Stories', value: 'stories' },
          { label: 'Captions', value: 'captions' },
        ],
        defaultValue: ['reels', 'captions'],
      },
    ],
  },

  'comment-magnet': {
    id: 'comment-magnet',
    name: 'Comment Magnet',
    description: 'Generate comment-driving questions and a pinned comment.',
    enabled: true,
    isPublic: true,
    tags: ['comments', 'engagement', 'reels'],
    difficulty: 'easy',
    examples: [{ label: 'Topic prompts', input: { postTopic: 'Why your Reels don’t get saved' } }],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 12,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 50,
      team: 100,
      lifetime: 200,
    },
    fields: [{ key: 'postTopic', label: 'Post topic', type: 'shortText', required: true }],
  },

  'profile-clarity-scan': {
    id: 'profile-clarity-scan',
    name: 'Profile Clarity Scan',
    description: 'Audit a profile for clarity + clicks and generate a better bio.',
    enabled: true,
    isPublic: true,
    tags: ['audience', 'profile', 'bio'],
    difficulty: 'medium',
    examples: [
      {
        label: 'Bio audit',
        input: {
          bio: 'Helping you grow on IG 🚀 DM me “GROW”',
          link: 'https://example.com',
          offer: 'Reels script templates',
        },
      },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 18,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'bio', label: 'Current bio', type: 'longText', required: true },
      { key: 'link', label: 'Link in bio', type: 'shortText', required: false },
      { key: 'offer', label: 'Primary offer', type: 'shortText', required: false },
    ],
  },

  'bio-to-cta': {
    id: 'bio-to-cta',
    name: 'Bio → CTA',
    description: 'Generate CTA options that actually match your profile.',
    enabled: true,
    isPublic: true,
    tags: ['bio', 'cta', 'conversion'],
    difficulty: 'easy',
    examples: [{ label: 'Extract CTA', input: { bio: 'I help creators get clients with calm Reels. DM “CALM”.' } }],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 10,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 50,
      team: 100,
      lifetime: 200,
    },
    fields: [{ key: 'bio', label: 'Bio', type: 'longText', required: true }],
  },

  'carousel-blueprint': {
    id: 'carousel-blueprint',
    name: 'Carousel Blueprint',
    description: 'Outline a save-worthy carousel with slide text + caption.',
    enabled: true,
    isPublic: true,
    tags: ['carousel', 'saves', 'content'],
    difficulty: 'easy',
    examples: [{ label: 'Blueprint', input: { topic: '3 reasons your content is ignored', slides: 8 } }],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 18,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'topic', label: 'Topic', type: 'shortText', required: true },
      { key: 'slides', label: 'Slide count', type: 'number', required: false, min: 5, max: 12, step: 1, defaultValue: 8 },
    ],
  },

  'story-sequence-planner': {
    id: 'story-sequence-planner',
    name: 'Story Sequence Planner',
    description: 'Plan a multi-slide story sequence with a DM prompt.',
    enabled: true,
    isPublic: true,
    tags: ['stories', 'dm', 'conversion'],
    difficulty: 'easy',
    examples: [{ label: 'Story funnel', input: { goal: 'Get DMs for my offer', context: 'Audience is skeptical' } }],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 15,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'goal', label: 'Goal', type: 'shortText', required: true },
      { key: 'context', label: 'Context (optional)', type: 'longText', required: false },
    ],
  },

  'hashtag-support-pack': {
    id: 'hashtag-support-pack',
    name: 'Hashtag Support Pack',
    description: 'Generate supportive hashtag sets (not the main growth engine).',
    enabled: true,
    isPublic: true,
    tags: ['hashtags', 'metadata'],
    difficulty: 'easy',
    examples: [{ label: 'Hashtags', input: { niche: 'digital marketing', topic: 'reels hooks' } }],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'light',
    tokensPerRun: 10,
    dailyRunsByPlan: {
      free: 1,
      pro_monthly: 50,
      team: 100,
      lifetime: 200,
    },
    fields: [
      { key: 'niche', label: 'Niche', type: 'shortText', required: true },
      { key: 'topic', label: 'Topic', type: 'shortText', required: true },
    ],
  },

  'competitor-lunch-money': {
    id: 'competitor-lunch-money',
    name: 'Competitor Lunch Money',
    description: 'Find competitor patterns and exploitable gaps + 3 Reel ideas to steal attention.',
    enabled: true,
    isPublic: true,
    tags: ['competitor', 'strategy', 'angles'],
    difficulty: 'hard',
    examples: [{ label: 'Competitor teardown', input: { competitorHandle: '@somecoach', yourAngle: 'calm, no hype' } }],
    planEntitlements: planEntitlementsPaid,
    aiLevel: 'heavy',
    tokensPerRun: 35,
    dailyRunsByPlan: dailyRunsDefault,
    fields: [
      { key: 'competitorHandle', label: 'Competitor handle / link', type: 'shortText', required: true },
      { key: 'yourAngle', label: 'Your advantage (optional)', type: 'shortText', required: false },
    ],
  },

  'analytics-signal-reader': {
    id: 'analytics-signal-reader',
    name: 'Analytics Signal Reader',
    description: 'Turn your metrics into a prioritized fix list and next-post ideas.',
    enabled: true,
    isPublic: true,
    tags: ['performance', 'analytics', 'growth'],
    difficulty: 'medium',
    examples: [
      {
        label: 'Basic metrics read',
        input: {
          last30: 'Avg watch time: 3.2s, saves/post: 2, follows: 4, shares: 0, reach down 20%',
          priority: 'watch_time',
        },
      },
    ],
    planEntitlements: planEntitlementsPaid,
    aiLevel: 'heavy',
    tokensPerRun: 30,
    dailyRunsByPlan: dailyRunsDefault,
    fields: [
      { key: 'last30', label: 'Last 30 days metrics (paste)', type: 'longText', required: true },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        required: true,
        defaultValue: 'watch_time',
        options: [
          { label: 'Watch time', value: 'watch_time' },
          { label: 'Saves', value: 'saves' },
          { label: 'Follows', value: 'follows' },
          { label: 'Profile taps', value: 'profile_taps' },
        ],
      },
    ],
  },

  'audience-mirror': {
    id: 'audience-mirror',
    name: 'Audience Mirror',
    description: 'Get the real pains, desires, and language your audience actually uses.',
    enabled: true,
    isPublic: true,
    tags: ['audience', 'positioning', 'copy'],
    difficulty: 'medium',
    examples: [{ label: 'Define audience', input: { audience: 'new digital marketers selling templates' } }],
    planEntitlements: planEntitlementsPaid,
    aiLevel: 'heavy',
    tokensPerRun: 30,
    dailyRunsByPlan: dailyRunsDefault,
    fields: [{ key: 'audience', label: 'Audience description', type: 'longText', required: true }],
  },

  'objection-crusher': {
    id: 'objection-crusher',
    name: 'Objection Crusher',
    description: 'Generate a calm, confident reply to common objections (DM/comment/sales).',
    enabled: true,
    isPublic: true,
    tags: ['sales', 'objections', 'dm'],
    difficulty: 'medium',
    examples: [
      { label: 'Price objection', input: { objection: 'That’s too expensive.', offer: 'Reels template pack', channel: 'dm' } },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'heavy',
    tokensPerRun: 25,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      { key: 'objection', label: 'Objection', type: 'shortText', required: true },
      { key: 'offer', label: 'Offer (optional)', type: 'shortText', required: false },
      {
        key: 'channel',
        label: 'Channel',
        type: 'select',
        required: true,
        defaultValue: 'dm',
        options: [
          { label: 'DM', value: 'dm' },
          { label: 'Comments', value: 'comments' },
          { label: 'Sales call', value: 'call' },
        ],
      },
    ],
  },

  'launch-plan-sprinter': {
    id: 'launch-plan-sprinter',
    name: 'Launch Plan Sprinter',
    description: 'Generate a realistic launch plan: timeline, posts, DMs, and metrics.',
    enabled: true,
    isPublic: true,
    tags: ['launch', 'planning', 'offers'],
    difficulty: 'hard',
    examples: [{ label: '7-day launch', input: { offer: 'Mini course', timeframe: '7 days' } }],
    planEntitlements: planEntitlementsPaid,
    aiLevel: 'heavy',
    tokensPerRun: 35,
    dailyRunsByPlan: dailyRunsDefault,
    fields: [
      { key: 'timeframe', label: 'Timeframe', type: 'shortText', required: true, placeholder: 'e.g., 7 days / 14 days' },
      { key: 'offer', label: 'Offer', type: 'longText', required: true },
    ],
  },

  'content-calendar-minimal': {
    id: 'content-calendar-minimal',
    name: 'Content Calendar (Minimal)',
    description: 'A repeatable weekly plan with batching steps (no overengineering).',
    enabled: true,
    isPublic: true,
    tags: ['calendar', 'system', 'consistency'],
    difficulty: 'easy',
    examples: [
      { label: 'Simple plan', input: { topicPillars: 'Hooks, Offers, Proof, DM scripts', postsPerWeek: 5 } },
    ],
    planEntitlements: planEntitlementsAll,
    aiLevel: 'heavy',
    tokensPerRun: 25,
    dailyRunsByPlan: dailyRunsFreeTrialOnly,
    fields: [
      {
        key: 'topicPillars',
        label: 'Topic pillars',
        type: 'longText',
        required: true,
        placeholder: 'List 3–5 pillars…',
      },
      {
        key: 'postsPerWeek',
        label: 'Posts per week',
        type: 'number',
        required: true,
        min: 1,
        max: 14,
        step: 1,
        defaultValue: 5,
      },
    ],
  },
}

const TOOL_MICROCOPY: Record<ToolId, ToolMicrocopy> = {
  'hook-analyzer': {
    oneLiner: "Stop posting hooks that look good but don't hold attention.",
    whoFor: ['Creators stuck under 1k views', 'Marketers testing daily', 'People tired of guessing'],
    youInput: ['Your hook', 'Audience + format'],
    youGet: ['Hook score + type', '3 stronger variants', 'Why it fails in 1 line'],
  },
  'cta-match-analyzer': {
    oneLiner: 'Fix CTAs that don’t match the content promise.',
    whoFor: ['Creators with low saves', 'Offer owners testing CTAs', 'Content teams'],
    youInput: ['Post context', 'Current CTA'],
    youGet: ['CTA alignment score', 'Better CTA options', 'Mismatch reason'],
  },
  'dm-intelligence-engine': {
    oneLiner: 'Turn cold DMs into warm conversations fast.',
    whoFor: ['Closers doing daily outreach', 'Founders selling services', 'Teams booking calls'],
    youInput: ['Prospect context', 'Goal of the DM'],
    youGet: ['Opening message', 'Follow-up angles', 'Tone guidance'],
  },
  'retention-leak-finder': {
    oneLiner: 'Spot exactly where viewers drop off.',
    whoFor: ['Reel creators', 'Video marketers', 'Growth leads'],
    youInput: ['Video summary', 'Audience + length'],
    youGet: ['Drop-off checkpoints', 'Retention fixes', 'Re-hook ideas'],
  },
  'reel-script-builder': {
    oneLiner: 'Write reels that hold attention start to finish.',
    whoFor: ['Creators posting daily', 'Agencies shipping reels', 'Founders building authority'],
    youInput: ['Topic', 'Audience pain'],
    youGet: ['Script beats', 'On-screen hook', 'CTA line'],
  },
  'offer-clarity-check': {
    oneLiner: 'Make your offer obvious in 10 seconds.',
    whoFor: ['Service sellers', 'Course creators', 'Landing page owners'],
    youInput: ['Offer statement', 'Target buyer'],
    youGet: ['Clarity score', 'Tighter offer copy', 'Confusion points'],
  },
  'positioning-knife': {
    oneLiner: 'Slice vague positioning into a sharp angle.',
    whoFor: ['New brands', 'Freelancers who blend in', 'Teams rebranding'],
    youInput: ['Who you serve', 'What you do'],
    youGet: ['Positioning angle', 'Differentiator line', 'Competitor contrast'],
  },
  'content-repurpose-machine': {
    oneLiner: 'Turn one idea into a week of content.',
    whoFor: ['Solo creators', 'Busy founders', 'Small teams'],
    youInput: ['Source idea', 'Platform focus'],
    youGet: ['Repurpose angles', 'Format map', 'Posting order'],
  },
  'comment-magnet': {
    oneLiner: 'Engineer comments that kickstart reach.',
    whoFor: ['Creators with low engagement', 'Community builders', 'Brands launching posts'],
    youInput: ['Post topic', 'Audience vibe'],
    youGet: ['Comment bait lines', 'Pinned comment idea', 'Engagement prompts'],
  },
  'profile-clarity-scan': {
    oneLiner: 'Make your profile convert in one glance.',
    whoFor: ['Creators reworking bios', 'Coaches selling high-ticket', 'Founders fixing conversion'],
    youInput: ['Bio text', 'Audience goal'],
    youGet: ['Clarity score', 'Bio rewrite', 'Top 3 fixes'],
  },
  'bio-to-cta': {
    oneLiner: 'Turn your bio into a clear next step.',
    whoFor: ['Creators with low clicks', 'Lead-gen accounts', 'Service providers'],
    youInput: ['Bio + offer', 'Desired action'],
    youGet: ['CTA options', 'Bio rewrite', 'Best action line'],
  },
  'carousel-blueprint': {
    oneLiner: 'Plan carousels that hold attention.',
    whoFor: ['Educators', 'B2B creators', 'Storytellers'],
    youInput: ['Topic', 'Main takeaway'],
    youGet: ['Slide-by-slide outline', 'Hook slide', 'CTA slide'],
  },
  'story-sequence-planner': {
    oneLiner: 'Build story sequences that drive replies.',
    whoFor: ['IG storytellers', 'Launch weeks', 'Daily story posters'],
    youInput: ['Goal', 'Audience context'],
    youGet: ['Story flow', 'Frames + prompts', 'CTA moment'],
  },
  'hashtag-support-pack': {
    oneLiner: 'Use hashtags for reach without looking spammy.',
    whoFor: ['Reel creators', 'Niche accounts', 'Growth experiments'],
    youInput: ['Topic', 'Audience'],
    youGet: ['Hashtag set', 'Mix ratio', 'Placement tip'],
  },
  'competitor-lunch-money': {
    oneLiner: 'Steal share of attention with smarter angles.',
    whoFor: ['Challengers', 'New entrants', 'Positioning refresh'],
    youInput: ['Competitor list', 'Your offer'],
    youGet: ['Angle gaps', 'Differentiation hooks', 'Counter-position'],
  },
  'analytics-signal-reader': {
    oneLiner: 'Turn messy analytics into clear next moves.',
    whoFor: ['Data-averse creators', 'Growth leads', 'Teams reporting weekly'],
    youInput: ['Key metrics', 'Goal'],
    youGet: ['Signal summary', 'Priority actions', 'Metrics to watch'],
  },
  'audience-mirror': {
    oneLiner: 'Hear your audience back to you.',
    whoFor: ['Creators unsure of niche', 'Offer builders', 'Copywriters'],
    youInput: ['Audience description', 'Pain points'],
    youGet: ['Audience narrative', 'Language to use', 'Objections list'],
  },
  'objection-crusher': {
    oneLiner: 'Neutralize the top 3 buying objections.',
    whoFor: ['Sales pages', 'DM closers', 'Launch writers'],
    youInput: ['Offer + price', 'Common objections'],
    youGet: ['Rebuttal copy', 'Proof ideas', 'CTA tie-in'],
  },
  'launch-plan-sprinter': {
    oneLiner: 'Ship a launch plan in minutes.',
    whoFor: ['Course launches', 'Service launches', 'Small teams'],
    youInput: ['Offer', 'Timeframe'],
    youGet: ['Launch timeline', 'Daily content', 'DM plan'],
  },
  'content-calendar-minimal': {
    oneLiner: "A simple calendar you'll actually follow.",
    whoFor: ['Creators who overplan', 'Busy founders', 'Teams shipping weekly'],
    youInput: ['Topic pillars', 'Posts per week'],
    youGet: ['Weekly cadence', 'Batching plan', 'Topic rotation'],
  },
}

const TOOL_REGISTRY: Record<ToolId, ToolMeta> = Object.fromEntries(
  Object.entries(TOOL_REGISTRY_SEED).map(([id, tool]) => [
    id,
    {
      ...tool,
      microcopy: TOOL_MICROCOPY[id as ToolId],
      category: deriveCategoryFromTags(tool.tags),
    },
  ])
) as Record<ToolId, ToolMeta>

export function getToolMeta(toolId: string): ToolMeta {
  const tool = (TOOL_REGISTRY as Record<string, ToolMeta>)[toolId]
  if (!tool) throw new Error(`Unknown toolId: ${toolId}`)
  return tool
}

export function listTools(opts?: { includeHidden?: boolean }): ToolMeta[] {
  const includeHidden = Boolean(opts?.includeHidden)
  const tools = Object.values(TOOL_REGISTRY)

  return includeHidden ? tools : tools.filter((t) => t.enabled && t.isPublic)
}

export function listToolIds(opts?: { includeHidden?: boolean }): string[] {
  return listTools(opts).map((t) => t.id)
}

export { TOOL_REGISTRY, deriveCategoryFromTags }
