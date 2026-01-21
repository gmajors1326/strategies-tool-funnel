import { z } from 'zod'

export type FieldType = 'text' | 'textarea' | 'number' | 'select' | 'boolean'

export type FieldDef = {
  name: string
  label: string
  type: FieldType
  placeholder?: string
  help?: string
  options?: { label: string; value: string }[] // for select
  min?: number
  max?: number
  step?: number
  required?: boolean
  defaultValue?: any
}

export type ToolSchemaDef = {
  toolId: string
  description?: string
  schema: z.ZodObject<any>
  fields: FieldDef[]
}

/**
 * Canonical: schemas + field defs for every tool in TOOL_REGISTRY.
 * Tool Detail pages render inputs from these fields and validate with schema.
 */
export const TOOL_SCHEMAS: Record<string, ToolSchemaDef> = {
  // 1) DM / Conversation
  'dm-opener': {
    toolId: 'dm-opener',
    description: 'Generate DM openers tailored to a lead + offer + tone.',
    schema: z.object({
      niche: z.string().min(2),
      offer: z.string().min(2),
      leadContext: z.string().min(2),
      tone: z.enum(['calm', 'direct', 'playful', 'professional']).default('direct'),
      goal: z.enum(['book_call', 'sell_product', 'get_reply', 'qualify']).default('get_reply'),
    }),
    fields: [
      { name: 'niche', label: 'Niche', type: 'text', placeholder: 'e.g., fitness coaches', required: true },
      { name: 'offer', label: 'Offer', type: 'text', placeholder: 'e.g., $99 audit / coaching', required: true },
      {
        name: 'leadContext',
        label: 'Lead context',
        type: 'textarea',
        placeholder: 'What do we know about them? (profile, posts, pain, etc.)',
        required: true,
      },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        required: true,
        options: [
          { label: 'Calm', value: 'calm' },
          { label: 'Direct', value: 'direct' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
        defaultValue: 'direct',
      },
      {
        name: 'goal',
        label: 'Goal',
        type: 'select',
        required: true,
        options: [
          { label: 'Get a reply', value: 'get_reply' },
          { label: 'Qualify', value: 'qualify' },
          { label: 'Book a call', value: 'book_call' },
          { label: 'Sell product', value: 'sell_product' },
        ],
        defaultValue: 'get_reply',
      },
    ],
  },

  'dm-reply-builder': {
    toolId: 'dm-reply-builder',
    description: 'Turn a DM message into clean reply options that keep the convo moving.',
    schema: z.object({
      lastMessage: z.string().min(2),
      outcome: z.enum(['continue_convo', 'qualify', 'book_call', 'close_sale']).default('continue_convo'),
      tone: z.enum(['calm', 'direct', 'playful', 'professional']).default('direct'),
    }),
    fields: [
      {
        name: 'lastMessage',
        label: 'Their message',
        type: 'textarea',
        placeholder: 'Paste the last message they sent',
        required: true,
      },
      {
        name: 'outcome',
        label: 'Desired outcome',
        type: 'select',
        options: [
          { label: 'Keep conversation going', value: 'continue_convo' },
          { label: 'Qualify', value: 'qualify' },
          { label: 'Book a call', value: 'book_call' },
          { label: 'Close sale', value: 'close_sale' },
        ],
        defaultValue: 'continue_convo',
      },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        options: [
          { label: 'Calm', value: 'calm' },
          { label: 'Direct', value: 'direct' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
        defaultValue: 'direct',
      },
    ],
  },

  'dm-objection-crusher': {
    toolId: 'dm-objection-crusher',
    description: 'Handle common objections without sounding needy or defensive.',
    schema: z.object({
      objection: z.string().min(2),
      offer: z.string().optional(),
      tone: z.enum(['calm', 'direct', 'playful', 'professional']).default('direct'),
      goal: z.enum(['continue_convo', 'qualify', 'book_call', 'close_sale']).default('qualify'),
    }),
    fields: [
      {
        name: 'objection',
        label: 'Objection',
        type: 'textarea',
        placeholder: 'e.g., “No budget right now” / “Send info” / “I’m not interested”',
        required: true,
      },
      { name: 'offer', label: 'Your offer (optional)', type: 'text', placeholder: 'e.g., $99 audit / $500 package' },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        options: [
          { label: 'Calm', value: 'calm' },
          { label: 'Direct', value: 'direct' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
        defaultValue: 'direct',
      },
      {
        name: 'goal',
        label: 'Goal',
        type: 'select',
        options: [
          { label: 'Keep conversation going', value: 'continue_convo' },
          { label: 'Qualify', value: 'qualify' },
          { label: 'Book a call', value: 'book_call' },
          { label: 'Close sale', value: 'close_sale' },
        ],
        defaultValue: 'qualify',
      },
    ],
  },

  'dm-intelligence': {
    toolId: 'dm-intelligence',
    description: 'Score a lead + recommend the best DM sequence to convert.',
    schema: z.object({
      leadContext: z.string().min(2),
      offer: z.string().min(2),
      niche: z.string().optional(),
      goal: z.enum(['get_reply', 'qualify', 'book_call', 'close_sale']).default('qualify'),
    }),
    fields: [
      {
        name: 'leadContext',
        label: 'Lead context',
        type: 'textarea',
        placeholder: 'What do you know about this lead? (profile, posts, pain signals, etc.)',
        required: true,
      },
      { name: 'offer', label: 'Offer', type: 'text', placeholder: 'What are you selling?', required: true },
      { name: 'niche', label: 'Niche (optional)', type: 'text', placeholder: 'e.g., local service businesses' },
      {
        name: 'goal',
        label: 'Goal',
        type: 'select',
        options: [
          { label: 'Get a reply', value: 'get_reply' },
          { label: 'Qualify', value: 'qualify' },
          { label: 'Book a call', value: 'book_call' },
          { label: 'Close sale', value: 'close_sale' },
        ],
        defaultValue: 'qualify',
      },
    ],
  },

  // 2) Hooks / Reels performance
  'hook-repurposer': {
    toolId: 'hook-repurposer',
    description: 'Turn a topic into multiple high-retention hook variations.',
    schema: z.object({
      topic: z.string().min(2),
      audience: z.string().min(2).optional(),
      count: z.number().min(5).max(50).default(12),
      style: z.enum(['direct', 'curiosity', 'contrarian', 'proof_first']).default('curiosity'),
    }),
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., why your Reels don’t convert', required: true },
      { name: 'audience', label: 'Audience (optional)', type: 'text', placeholder: 'e.g., new marketers' },
      { name: 'count', label: 'How many hooks?', type: 'number', min: 5, max: 50, step: 1, defaultValue: 12 },
      {
        name: 'style',
        label: 'Style',
        type: 'select',
        options: [
          { label: 'Direct', value: 'direct' },
          { label: 'Curiosity', value: 'curiosity' },
          { label: 'Contrarian', value: 'contrarian' },
          { label: 'Proof-first', value: 'proof_first' },
        ],
        defaultValue: 'curiosity',
      },
    ],
  },

  'hook-library-builder': {
    toolId: 'hook-library-builder',
    description: 'Generate hook buckets you can reuse all month.',
    schema: z.object({
      niche: z.string().min(2),
      productType: z.enum(['service', 'course', 'saas', 'agency', 'ecommerce', 'creator']).default('service'),
      tone: z.enum(['calm', 'direct', 'playful', 'professional']).default('direct'),
    }),
    fields: [
      { name: 'niche', label: 'Niche', type: 'text', placeholder: 'e.g., real estate agents', required: true },
      {
        name: 'productType',
        label: 'Business type',
        type: 'select',
        options: [
          { label: 'Service', value: 'service' },
          { label: 'Course', value: 'course' },
          { label: 'SaaS', value: 'saas' },
          { label: 'Agency', value: 'agency' },
          { label: 'E-commerce', value: 'ecommerce' },
          { label: 'Creator', value: 'creator' },
        ],
        defaultValue: 'service',
      },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        options: [
          { label: 'Calm', value: 'calm' },
          { label: 'Direct', value: 'direct' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
        defaultValue: 'direct',
      },
    ],
  },

  'retention-leak-finder': {
    toolId: 'retention-leak-finder',
    description: 'Find why people drop off and what to fix first.',
    schema: z.object({
      videoLengthSeconds: z.number().min(3).max(180),
      hookText: z.string().min(2),
      structure: z.enum(['talking_head', 'broll_text', 'screen_recording', 'mixed']).default('mixed'),
      avgViewDurationSeconds: z.number().min(0).max(180).optional(),
    }),
    fields: [
      { name: 'videoLengthSeconds', label: 'Video length (seconds)', type: 'number', min: 3, max: 180, step: 1, required: true },
      { name: 'hookText', label: 'Hook text', type: 'textarea', placeholder: 'Your first line / on-screen text', required: true },
      {
        name: 'structure',
        label: 'Structure',
        type: 'select',
        options: [
          { label: 'Talking head', value: 'talking_head' },
          { label: 'B-roll + text', value: 'broll_text' },
          { label: 'Screen recording', value: 'screen_recording' },
          { label: 'Mixed', value: 'mixed' },
        ],
        defaultValue: 'mixed',
      },
      { name: 'avgViewDurationSeconds', label: 'Avg view duration (optional)', type: 'number', min: 0, max: 180, step: 1 },
    ],
  },

  'reel-script-6sec': {
    toolId: 'reel-script-6sec',
    description: 'Generate a tight 6-second Reel script (hook → one idea → loop).',
    schema: z.object({
      topic: z.string().min(2),
      audience: z.string().optional(),
      cta: z.enum(['save', 'follow', 'dm_keyword', 'comment_keyword', 'link_in_bio']).default('save'),
    }),
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., why your hook dies in 1 second', required: true },
      { name: 'audience', label: 'Audience (optional)', type: 'text', placeholder: 'e.g., freelancers' },
      {
        name: 'cta',
        label: 'CTA',
        type: 'select',
        options: [
          { label: 'Save', value: 'save' },
          { label: 'Follow', value: 'follow' },
          { label: 'DM keyword', value: 'dm_keyword' },
          { label: 'Comment keyword', value: 'comment_keyword' },
          { label: 'Link in bio', value: 'link_in_bio' },
        ],
        defaultValue: 'save',
      },
    ],
  },

  'reel-do-not-post': {
    toolId: 'reel-do-not-post',
    description: 'A quick filter to tell you if your hook/idea is worth posting today.',
    schema: z.object({
      hookText: z.string().min(2),
      promise: z.string().optional(),
      targetAudience: z.string().optional(),
    }),
    fields: [
      { name: 'hookText', label: 'Hook text', type: 'textarea', placeholder: 'Paste your opening line / overlay', required: true },
      { name: 'promise', label: 'Promise (optional)', type: 'text', placeholder: 'What do they get by watching?' },
      { name: 'targetAudience', label: 'Audience (optional)', type: 'text', placeholder: 'Who is this for?' },
    ],
  },

  // 3) Account diagnostics / positioning
  'engagement-diagnostic': {
    toolId: 'engagement-diagnostic',
    description: 'Diagnose engagement weakness and produce tighter rewrites + CTAs.',
    schema: z.object({
      caption: z.string().min(2),
      goal: z.enum(['more_saves', 'more_comments', 'more_dms', 'more_clicks']).default('more_saves'),
      niche: z.string().optional(),
    }),
    fields: [
      { name: 'caption', label: 'Caption / post text', type: 'textarea', placeholder: 'Paste what you posted (or plan to)', required: true },
      {
        name: 'goal',
        label: 'Optimization goal',
        type: 'select',
        options: [
          { label: 'More saves', value: 'more_saves' },
          { label: 'More comments', value: 'more_comments' },
          { label: 'More DMs', value: 'more_dms' },
          { label: 'More clicks', value: 'more_clicks' },
        ],
        defaultValue: 'more_saves',
      },
      { name: 'niche', label: 'Niche (optional)', type: 'text', placeholder: 'e.g., fitness' },
    ],
  },

  'profile-clarity-audit': {
    toolId: 'profile-clarity-audit',
    description: 'Audit your bio/profile clarity: who it’s for, what you do, and the next step.',
    schema: z.object({
      bio: z.string().min(2),
      niche: z.string().optional(),
      linkDestination: z.string().optional(),
    }),
    fields: [
      { name: 'bio', label: 'Current bio', type: 'textarea', placeholder: 'Paste your bio', required: true },
      { name: 'niche', label: 'Niche (optional)', type: 'text', placeholder: 'e.g., creators' },
      { name: 'linkDestination', label: 'Link destination (optional)', type: 'text', placeholder: 'What does your link go to?' },
    ],
  },

  'niche-magnet': {
    toolId: 'niche-magnet',
    description: 'Turn your niche into a clear “this account is for…” statement + angles.',
    schema: z.object({
      audience: z.string().min(2),
      outcome: z.string().min(2),
      method: z.string().optional(),
    }),
    fields: [
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g., new digital marketers', required: true },
      { name: 'outcome', label: 'Outcome', type: 'text', placeholder: 'e.g., more leads from IG', required: true },
      { name: 'method', label: 'Method (optional)', type: 'text', placeholder: 'e.g., retention-first Reels system' },
    ],
  },

  'bio-optimizer': {
    toolId: 'bio-optimizer',
    description: 'Generate bio options that are clear, specific, and conversion-friendly.',
    schema: z.object({
      niche: z.string().min(2),
      offer: z.string().min(2),
      proof: z.string().optional(),
      cta: z.enum(['dm_keyword', 'link_in_bio', 'follow']).default('dm_keyword'),
    }),
    fields: [
      { name: 'niche', label: 'Niche / audience', type: 'text', placeholder: 'e.g., local service businesses', required: true },
      { name: 'offer', label: 'Offer / result', type: 'text', placeholder: 'e.g., booked calls from IG', required: true },
      { name: 'proof', label: 'Proof (optional)', type: 'text', placeholder: 'e.g., 200+ clients / $50k/mo' },
      {
        name: 'cta',
        label: 'Primary CTA',
        type: 'select',
        options: [
          { label: 'DM keyword', value: 'dm_keyword' },
          { label: 'Link in bio', value: 'link_in_bio' },
          { label: 'Follow', value: 'follow' },
        ],
        defaultValue: 'dm_keyword',
      },
    ],
  },

  // 4) Offers / conversion sanity
  'cta-match-analyzer': {
    toolId: 'cta-match-analyzer',
    description: 'Check if your CTA matches your offer and improve it.',
    schema: z.object({
      offer: z.string().min(2),
      cta: z.string().min(2),
      funnelStep: z.enum(['top', 'mid', 'bottom']).default('mid'),
    }),
    fields: [
      { name: 'offer', label: 'Offer', type: 'textarea', placeholder: 'What are you offering?', required: true },
      { name: 'cta', label: 'Current CTA', type: 'text', placeholder: 'e.g., “DM me” / “Link in bio”', required: true },
      {
        name: 'funnelStep',
        label: 'Funnel step',
        type: 'select',
        options: [
          { label: 'Top (awareness)', value: 'top' },
          { label: 'Mid (consideration)', value: 'mid' },
          { label: 'Bottom (decision)', value: 'bottom' },
        ],
        defaultValue: 'mid',
      },
    ],
  },

  'offer-one-liner': {
    toolId: 'offer-one-liner',
    description: 'Generate short offer lines you can use in bio, captions, and DMs.',
    schema: z.object({
      audience: z.string().min(2),
      result: z.string().min(2),
      method: z.string().optional(),
      timeFrame: z.string().optional(),
    }),
    fields: [
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g., coaches', required: true },
      { name: 'result', label: 'Result', type: 'text', placeholder: 'e.g., 10 booked calls/mo', required: true },
      { name: 'method', label: 'Method (optional)', type: 'text', placeholder: 'e.g., Reels + DM system' },
      { name: 'timeFrame', label: 'Timeframe (optional)', type: 'text', placeholder: 'e.g., in 30 days' },
    ],
  },

  'landing-page-teardown': {
    toolId: 'landing-page-teardown',
    description: 'Get a teardown checklist for a landing page: promise, proof, CTA, friction.',
    schema: z.object({
      url: z.string().optional(),
      offer: z.string().min(2),
      audience: z.string().optional(),
      primaryCta: z.string().optional(),
    }),
    fields: [
      { name: 'url', label: 'Landing page URL (optional)', type: 'text', placeholder: 'https://...' },
      { name: 'offer', label: 'Offer', type: 'textarea', placeholder: 'Describe what the page sells', required: true },
      { name: 'audience', label: 'Audience (optional)', type: 'text', placeholder: 'Who is it for?' },
      { name: 'primaryCta', label: 'Primary CTA (optional)', type: 'text', placeholder: 'e.g., Book a call' },
    ],
  },

  // 5) Content planning / consistency
  '30-day-reels-plan': {
    toolId: '30-day-reels-plan',
    description: 'Generate a month of Reels ideas with repeatable formats.',
    schema: z.object({
      niche: z.string().min(2),
      offer: z.string().optional(),
      postingDays: z.number().min(7).max(30).default(30),
      intensity: z.enum(['light', 'standard', 'aggressive']).default('standard'),
    }),
    fields: [
      { name: 'niche', label: 'Niche', type: 'text', placeholder: 'e.g., freelancers', required: true },
      { name: 'offer', label: 'Offer (optional)', type: 'text', placeholder: 'What do you sell?' },
      { name: 'postingDays', label: 'Days to generate', type: 'number', min: 7, max: 30, step: 1, defaultValue: 30 },
      {
        name: 'intensity',
        label: 'Intensity',
        type: 'select',
        options: [
          { label: 'Light', value: 'light' },
          { label: 'Standard', value: 'standard' },
          { label: 'Aggressive', value: 'aggressive' },
        ],
        defaultValue: 'standard',
      },
    ],
  },

  'content-pillar-generator': {
    toolId: 'content-pillar-generator',
    description: 'Create content pillars + examples so you stop guessing what to post.',
    schema: z.object({
      niche: z.string().min(2),
      offer: z.string().optional(),
      audienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    }),
    fields: [
      { name: 'niche', label: 'Niche', type: 'text', placeholder: 'e.g., digital marketers', required: true },
      { name: 'offer', label: 'Offer (optional)', type: 'text', placeholder: 'What do you sell?' },
      {
        name: 'audienceLevel',
        label: 'Audience level',
        type: 'select',
        options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Intermediate', value: 'intermediate' },
          { label: 'Advanced', value: 'advanced' },
        ],
        defaultValue: 'beginner',
      },
    ],
  },

  'carousel-outline-builder': {
    toolId: 'carousel-outline-builder',
    description: 'Build a carousel outline that drives saves and profile taps.',
    schema: z.object({
      topic: z.string().min(2),
      angle: z.enum(['contrarian', 'how_to', 'mistakes', 'framework', 'checklist']).default('framework'),
      slides: z.number().min(3).max(10).default(5),
      cta: z.enum(['save', 'follow', 'dm_keyword', 'comment_keyword']).default('save'),
    }),
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., why your hooks fail', required: true },
      {
        name: 'angle',
        label: 'Angle',
        type: 'select',
        options: [
          { label: 'Framework', value: 'framework' },
          { label: 'How-to', value: 'how_to' },
          { label: 'Mistakes', value: 'mistakes' },
          { label: 'Contrarian', value: 'contrarian' },
          { label: 'Checklist', value: 'checklist' },
        ],
        defaultValue: 'framework',
      },
      { name: 'slides', label: 'Slide count', type: 'number', min: 3, max: 10, step: 1, defaultValue: 5 },
      {
        name: 'cta',
        label: 'CTA',
        type: 'select',
        options: [
          { label: 'Save', value: 'save' },
          { label: 'Follow', value: 'follow' },
          { label: 'DM keyword', value: 'dm_keyword' },
          { label: 'Comment keyword', value: 'comment_keyword' },
        ],
        defaultValue: 'save',
      },
    ],
  },

  // 6) Comments / community
  'comment-reply-generator': {
    toolId: 'comment-reply-generator',
    description: 'Generate comment replies that build conversation (and trigger more comments).',
    schema: z.object({
      comment: z.string().min(2),
      goal: z.enum(['continue_thread', 'drive_dm', 'drive_save', 'drive_profile_tap']).default('continue_thread'),
      tone: z.enum(['calm', 'direct', 'playful', 'professional']).default('direct'),
    }),
    fields: [
      { name: 'comment', label: 'Comment', type: 'textarea', placeholder: 'Paste the comment you’re replying to', required: true },
      {
        name: 'goal',
        label: 'Goal',
        type: 'select',
        options: [
          { label: 'Continue thread', value: 'continue_thread' },
          { label: 'Drive DM', value: 'drive_dm' },
          { label: 'Drive save', value: 'drive_save' },
          { label: 'Drive profile tap', value: 'drive_profile_tap' },
        ],
        defaultValue: 'continue_thread',
      },
      {
        name: 'tone',
        label: 'Tone',
        type: 'select',
        options: [
          { label: 'Calm', value: 'calm' },
          { label: 'Direct', value: 'direct' },
          { label: 'Playful', value: 'playful' },
          { label: 'Professional', value: 'professional' },
        ],
        defaultValue: 'direct',
      },
    ],
  },

  // 7) Competitive intelligence
  'competitor-reverse-engineer': {
    toolId: 'competitor-reverse-engineer',
    description: 'Reverse-engineer a competitor’s patterns so you can out-position them.',
    schema: z.object({
      competitorHandleOrUrl: z.string().min(2),
      niche: z.string().optional(),
      goal: z.enum(['grow_followers', 'get_leads', 'sell_product', 'authority']).default('grow_followers'),
    }),
    fields: [
      { name: 'competitorHandleOrUrl', label: 'Competitor handle or URL', type: 'text', placeholder: '@handle or https://...', required: true },
      { name: 'niche', label: 'Niche (optional)', type: 'text', placeholder: 'e.g., marketing' },
      {
        name: 'goal',
        label: 'Goal',
        type: 'select',
        options: [
          { label: 'Grow followers', value: 'grow_followers' },
          { label: 'Get leads', value: 'get_leads' },
          { label: 'Sell product', value: 'sell_product' },
          { label: 'Build authority', value: 'authority' },
        ],
        defaultValue: 'grow_followers',
      },
    ],
  },

  // 8) Captions
  'caption-polisher': {
    toolId: 'caption-polisher',
    description: 'Tighten a caption so it’s clear, punchy, and aligned with the CTA.',
    schema: z.object({
      caption: z.string().min(2),
      goal: z.enum(['saves', 'comments', 'dms', 'clicks']).default('saves'),
      length: z.enum(['short', 'medium', 'long']).default('short'),
    }),
    fields: [
      { name: 'caption', label: 'Caption', type: 'textarea', placeholder: 'Paste your caption', required: true },
      {
        name: 'goal',
        label: 'Goal',
        type: 'select',
        options: [
          { label: 'Saves', value: 'saves' },
          { label: 'Comments', value: 'comments' },
          { label: 'DMs', value: 'dms' },
          { label: 'Clicks', value: 'clicks' },
        ],
        defaultValue: 'saves',
      },
      {
        name: 'length',
        label: 'Preferred length',
        type: 'select',
        options: [
          { label: 'Short', value: 'short' },
          { label: 'Medium', value: 'medium' },
          { label: 'Long', value: 'long' },
        ],
        defaultValue: 'short',
      },
    ],
  },
}

export function getToolSchema(toolId: string) {
  return TOOL_SCHEMAS[toolId] ?? null
}
