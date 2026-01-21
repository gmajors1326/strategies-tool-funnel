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
 * Add tools here over time.
 * If a toolId is missing from TOOL_SCHEMAS, the Tool page falls back to JSON input.
 */
export const TOOL_SCHEMAS: Record<string, ToolSchemaDef> = {
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
      { name: 'leadContext', label: 'Lead context', type: 'textarea', placeholder: 'What do we know about them?', required: true },
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

  'hook-repurposer': {
    toolId: 'hook-repurposer',
    description: 'Turn a topic into multiple high-retention hook variations.',
    schema: z.object({
      topic: z.string().min(2),
      audience: z.string().min(2),
      format: z.enum(['reels', 'carousel', 'stories']).default('reels'),
      count: z.number().min(5).max(50).default(15),
    }),
    fields: [
      { name: 'topic', label: 'Topic', type: 'text', placeholder: 'e.g., why your Reels don’t convert', required: true },
      { name: 'audience', label: 'Audience', type: 'text', placeholder: 'e.g., new digital marketers', required: true },
      {
        name: 'format',
        label: 'Format',
        type: 'select',
        options: [
          { label: 'Reels', value: 'reels' },
          { label: 'Carousel', value: 'carousel' },
          { label: 'Stories', value: 'stories' },
        ],
        defaultValue: 'reels',
      },
      { name: 'count', label: 'How many hooks?', type: 'number', min: 5, max: 50, step: 1, defaultValue: 15 },
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
      { name: 'hookText', label: 'Hook text', type: 'textarea', placeholder: 'Paste your first line / on-screen text', required: true },
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
}

export function getToolSchema(toolId: string) {
  return TOOL_SCHEMAS[toolId] ?? null
}
