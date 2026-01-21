import { z } from 'zod'
import type { RunRequest } from '@/src/lib/tools/runTypes'
import type { ToolMeta } from '@/src/lib/tools/toolMeta'
import { getOpenAIClient, pickModel, safetyIdentifierFromUserId } from '@/src/lib/ai/openaiClient'
import { zodTextFormat } from 'openai/helpers/zod'

export type RunContext = {
  user: { id: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
  toolMeta: ToolMeta
  usage: { aiTokensRemaining: number }
  logger: { info: (msg: string, meta?: any) => void; error: (msg: string, meta?: any) => void }
}

/**
 * IMPORTANT:
 * - Each tool uses Structured Outputs (Zod) so you ALWAYS get valid JSON.
 * - Your /api/tools/run already meters tokens; this file just makes outputs real.
 */

// ---------- Shared Schemas ----------
const HookAnalyzerSchema = z.object({
  hookScore: z.number().min(0).max(100),
  hookType: z.enum(['Curiosity', 'Direct', 'Contrarian', 'Authority', 'Story', 'Shock']),
  strongerHooks: z.array(z.string()).min(3).max(7),
  notes: z.array(z.string()).min(2).max(8),
})

const CtaMatchAnalyzerSchema = z.object({
  matchScore: z.number().min(0).max(100),
  mismatchReasons: z.array(z.string()),
  improvedCtas: z.array(z.string()).min(3).max(8),
})

const IgPostIntelSchema = z.object({
  hookQuality: z.enum(['Strong', 'Medium', 'Weak']),
  clarity: z.enum(['Clear', 'Mixed', 'Unclear']),
  savePotential: z.enum(['High', 'Medium', 'Low']),
  rewriteCaption: z.string(),
  hookOptions: z.array(z.string()).min(3).max(8),
  pacingNotes: z.array(z.string()).min(2).max(10),
})

const YtVideoIntelSchema = z.object({
  retentionRisks: z.array(z.string()).min(2).max(10),
  hookRewrite: z.string(),
  titleOptions: z.array(z.string()).min(3).max(8),
  pacingNotes: z.array(z.string()).min(2).max(10),
})

const DmOpenerSchema = z.object({
  openerOptions: z.array(z.string()).min(5).max(12),
  followUpOptions: z.array(z.string()).min(3).max(8),
  doNotSay: z.array(z.string()).min(3).max(10),
  tone: z.enum(['Calm', 'Direct', 'Playful', 'Professional']),
})

const EngagementDiagnosticSchema = z.object({
  diagnosis: z.array(z.string()).min(3).max(10),
  fixes: z.array(z.string()).min(3).max(12),
  nextPostIdeas: z.array(z.string()).min(3).max(10),
  priority: z.enum(['Fix Hook', 'Fix Offer', 'Fix Targeting', 'Fix Format', 'Fix Consistency']),
})

const HookRepurposerSchema = z.object({
  hookVariants: z.array(z.string()).min(10).max(25),
  best3: z.array(z.string()).length(3),
  recommendedAngle: z.enum(['Contrarian', 'Practical', 'Curiosity', 'Authority', 'Story']),
})

const DmIntelligenceSchema = z.object({
  leadScore: z.number().min(0).max(100),
  intentSignals: z.array(z.string()).min(2).max(12),
  bestNextMessage: z.string(),
  objectionGuesses: z.array(z.string()).min(1).max(8),
  closePaths: z.array(z.string()).min(2).max(8),
})

const RetentionLeakFinderSchema = z.object({
  leaks: z.array(z.string()).min(3).max(10),
  fixes: z.array(z.string()).min(3).max(12),
  rewriteOutline: z.array(z.string()).min(4).max(14),
  loopSuggestion: z.string(),
})

// ---- Extra schemas to get you to 20 tools ----
const CaptionShortenerSchema = z.object({
  shortCaption: z.string(),
  ultraShortCaption: z.string(),
  ctaOptions: z.array(z.string()).min(3).max(8),
})

const ReelScriptBuilderSchema = z.object({
  hook: z.string(),
  beats: z.array(z.string()).min(4).max(12),
  onScreenText: z.array(z.string()).min(4).max(12),
  loopEnding: z.string(),
})

const ContentCalendarSchema = z.object({
  days: z
    .array(
      z.object({
        day: z.number().min(1).max(30),
        reelIdea: z.string(),
        hook: z.string(),
        cta: z.string(),
      })
    )
    .min(7)
    .max(30),
})

const HashtagCuratorSchema = z.object({
  hashtagSets: z
    .array(
      z.object({
        label: z.string(),
        tags: z.array(z.string()).min(10).max(25),
      })
    )
    .min(2)
    .max(6),
})

const BioOptimizerSchema = z.object({
  bio: z.string(),
  nameField: z.string(),
  profileCta: z.string(),
  pinnedPostIdeas: z.array(z.string()).min(3).max(8),
})

const OfferClarifierSchema = z.object({
  oneLiner: z.string(),
  bullets: z.array(z.string()).min(3).max(8),
  whoItsFor: z.string(),
  whoItsNotFor: z.string(),
  pricingPositioning: z.string(),
})

const CommentReplyGeneratorSchema = z.object({
  replies: z.array(z.string()).min(8).max(20),
  pinnedReply: z.string(),
  questionsToAskBack: z.array(z.string()).min(3).max(10),
})

const StorySequencePlannerSchema = z.object({
  slides: z
    .array(
      z.object({
        slide: z.number().min(1).max(20),
        text: z.string(),
        stickerSuggestion: z.string().optional(),
      })
    )
    .min(3)
    .max(12),
  dmPrompt: z.string(),
})

const CarouselOutlineSchema = z.object({
  title: z.string(),
  slides: z.array(z.string()).min(5).max(10),
  caption: z.string(),
  saveHook: z.string(),
})

const AudienceClarifierSchema = z.object({
  target: z.string(),
  pains: z.array(z.string()).min(3).max(10),
  desires: z.array(z.string()).min(3).max(10),
  languageToUse: z.array(z.string()).min(5).max(15),
  languageToAvoid: z.array(z.string()).min(5).max(15),
})

const CompetitorAngleFinderSchema = z.object({
  competitorPatterns: z.array(z.string()).min(3).max(12),
  gapsToExploit: z.array(z.string()).min(3).max(12),
  angles: z.array(z.string()).min(5).max(15),
  first3Reels: z.array(z.string()).min(3).max(3),
})

// ---------- Tool Spec Map (20 tools) ----------
type AiLevel = 'none' | 'light' | 'heavy'
type ToolSpec = {
  aiLevel: AiLevel
  schema: z.ZodTypeAny
  buildMessages: (req: RunRequest, ctx: RunContext) => Array<{ role: 'system' | 'user'; content: string }>
}

const TOOL_SPECS: Record<string, ToolSpec> = {
  // 1
  'hook-analyzer': {
    aiLevel: 'light',
    schema: HookAnalyzerSchema,
    buildMessages: (req) => {
      const hook = String(req.input.hook ?? req.input.topic ?? '').trim()
      return [
        {
          role: 'system',
          content:
            'You are an elite short-form hook editor. Output must match the provided JSON schema. No extra text.',
        },
        {
          role: 'user',
          content: `Analyze this hook and improve it:\n\nHOOK:\n${hook || '(missing hook)'}\n\nReturn: score, type, strongerHooks, notes.`,
        },
      ]
    },
  },

  // 2
  'cta-match-analyzer': {
    aiLevel: 'light',
    schema: CtaMatchAnalyzerSchema,
    buildMessages: (req) => {
      const offer = String(req.input.offer ?? '').trim()
      const cta = String(req.input.cta ?? '').trim()
      return [
        { role: 'system', content: 'You are a conversion strategist. Output JSON matching schema only.' },
        {
          role: 'user',
          content: `Score CTA-to-offer match.\n\nOFFER:\n${offer}\n\nCTA:\n${cta}\n\nReturn: matchScore, mismatchReasons, improvedCtas.`,
        },
      ]
    },
  },

  // 3
  'ig-post-intelligence': {
    aiLevel: 'heavy',
    schema: IgPostIntelSchema,
    buildMessages: (req) => {
      const caption = String(req.input.caption ?? req.input.postText ?? '').trim()
      return [
        { role: 'system', content: 'You analyze IG posts for retention + saves. Output JSON only.' },
        {
          role: 'user',
          content: `Analyze this caption and rewrite it for clarity + saves.\n\nCAPTION:\n${caption}\n\nReturn: hookQuality, clarity, savePotential, rewriteCaption, hookOptions, pacingNotes.`,
        },
      ]
    },
  },

  // 4
  'yt-video-intelligence': {
    aiLevel: 'heavy',
    schema: YtVideoIntelSchema,
    buildMessages: (req) => {
      const title = String(req.input.title ?? '').trim()
      const desc = String(req.input.description ?? req.input.desc ?? '').trim()
      return [
        { role: 'system', content: 'You are a retention-first YouTube strategist. Output JSON only.' },
        {
          role: 'user',
          content: `Analyze this YouTube video concept for retention risks.\n\nTITLE:\n${title || '(missing)'}\n\nDESCRIPTION/NOTES:\n${desc || '(none)'}\n\nReturn: retentionRisks, hookRewrite, titleOptions, pacingNotes.`,
        },
      ]
    },
  },

  // 5
  'dm-opener': {
    aiLevel: 'light',
    schema: DmOpenerSchema,
    buildMessages: (req) => {
      const niche = String(req.input.niche ?? req.input.audience ?? '').trim()
      const context = String(req.input.context ?? req.input.theirPost ?? '').trim()
      return [
        { role: 'system', content: 'You write non-cringe DMs that start conversations. Output JSON only.' },
        {
          role: 'user',
          content: `Generate DM openers.\n\nNICHE/AUDIENCE:\n${niche || '(unknown)'}\n\nCONTEXT (their post / situation):\n${context || '(none)'}\n\nReturn: openerOptions, followUpOptions, doNotSay, tone.`,
        },
      ]
    },
  },

  // 6
  'engagement-diagnostic': {
    aiLevel: 'heavy',
    schema: EngagementDiagnosticSchema,
    buildMessages: (req) => {
      const stats = String(req.input.stats ?? req.input.metrics ?? '').trim()
      const sample = String(req.input.samplePost ?? req.input.post ?? '').trim()
      return [
        { role: 'system', content: 'You diagnose IG engagement issues with practical fixes. Output JSON only.' },
        {
          role: 'user',
          content: `Diagnose engagement and prescribe fixes.\n\nSTATS:\n${stats || '(none)'}\n\nSAMPLE POST/CAPTION:\n${sample || '(none)'}\n\nReturn: diagnosis, fixes, nextPostIdeas, priority.`,
        },
      ]
    },
  },

  // 7
  'hook-repurposer': {
    aiLevel: 'light',
    schema: HookRepurposerSchema,
    buildMessages: (req) => {
      const base = String(req.input.hook ?? req.input.topic ?? req.input.idea ?? '').trim()
      return [
        { role: 'system', content: 'You generate MANY hook variants fast. Output JSON only.' },
        {
          role: 'user',
          content: `Repurpose this into multiple hooks optimized for retention.\n\nBASE:\n${base}\n\nReturn: hookVariants (10-25), best3 (exactly 3), recommendedAngle.`,
        },
      ]
    },
  },

  // 8
  'dm-intelligence': {
    aiLevel: 'heavy',
    schema: DmIntelligenceSchema,
    buildMessages: (req) => {
      const convo = String(req.input.conversation ?? req.input.thread ?? '').trim()
      const offer = String(req.input.offer ?? '').trim()
      return [
        { role: 'system', content: 'You analyze DMs for intent and next best move. Output JSON only.' },
        {
          role: 'user',
          content: `Analyze this DM thread and recommend next message.\n\nOFFER:\n${offer || '(none)'}\n\nDM THREAD:\n${convo || '(missing)'}\n\nReturn: leadScore, intentSignals, bestNextMessage, objectionGuesses, closePaths.`,
        },
      ]
    },
  },

  // 9
  'retention-leak-finder': {
    aiLevel: 'light',
    schema: RetentionLeakFinderSchema,
    buildMessages: (req) => {
      const script = String(req.input.script ?? req.input.transcript ?? '').trim()
      return [
        { role: 'system', content: 'You find retention leaks in short-form scripts. Output JSON only.' },
        {
          role: 'user',
          content: `Find retention leaks and fixes.\n\nSCRIPT/TRANSCRIPT:\n${script || '(missing)'}\n\nReturn: leaks, fixes, rewriteOutline, loopSuggestion.`,
        },
      ]
    },
  },

  // 10
  'caption-shortener': {
    aiLevel: 'light',
    schema: CaptionShortenerSchema,
    buildMessages: (req) => {
      const caption = String(req.input.caption ?? '').trim()
      return [
        { role: 'system', content: 'You compress captions without losing the point. Output JSON only.' },
        {
          role: 'user',
          content: `Shorten this caption.\n\nCAPTION:\n${caption || '(missing)'}\n\nReturn: shortCaption, ultraShortCaption, ctaOptions.`,
        },
      ]
    },
  },

  // 11
  'reel-script-builder': {
    aiLevel: 'heavy',
    schema: ReelScriptBuilderSchema,
    buildMessages: (req) => {
      const topic = String(req.input.topic ?? req.input.idea ?? '').trim()
      const audience = String(req.input.audience ?? '').trim()
      return [
        { role: 'system', content: 'You write retention-optimized Reels scripts. Output JSON only.' },
        {
          role: 'user',
          content: `Write a Reel script.\n\nTOPIC:\n${topic || '(missing)'}\n\nAUDIENCE:\n${audience || '(unknown)'}\n\nReturn: hook, beats, onScreenText, loopEnding.`,
        },
      ]
    },
  },

  // 12
  'content-calendar': {
    aiLevel: 'heavy',
    schema: ContentCalendarSchema,
    buildMessages: (req) => {
      const niche = String(req.input.niche ?? '').trim()
      const days = Number(req.input.days ?? 14)
      return [
        { role: 'system', content: 'You build a realistic posting calendar. Output JSON only.' },
        {
          role: 'user',
          content: `Create a ${days}-day content calendar.\n\nNICHE:\n${niche || '(missing)'}\n\nReturn: days[{day,reelIdea,hook,cta}].`,
        },
      ]
    },
  },

  // 13
  'hashtag-curator': {
    aiLevel: 'light',
    schema: HashtagCuratorSchema,
    buildMessages: (req) => {
      const niche = String(req.input.niche ?? '').trim()
      const topic = String(req.input.topic ?? '').trim()
      return [
        { role: 'system', content: 'You provide hashtags as supporting metadata. Output JSON only.' },
        {
          role: 'user',
          content: `Create 2-6 hashtag sets.\n\nNICHE:\n${niche}\n\nTOPIC:\n${topic}\n\nReturn: hashtagSets[{label,tags[10-25]}].`,
        },
      ]
    },
  },

  // 14
  'bio-optimizer': {
    aiLevel: 'light',
    schema: BioOptimizerSchema,
    buildMessages: (req) => {
      const who = String(req.input.who ?? req.input.niche ?? '').trim()
      const offer = String(req.input.offer ?? '').trim()
      return [
        { role: 'system', content: 'You rewrite IG bios for clarity and clicks. Output JSON only.' },
        {
          role: 'user',
          content: `Rewrite IG bio.\n\nWHO YOU HELP:\n${who}\n\nOFFER:\n${offer}\n\nReturn: bio, nameField, profileCta, pinnedPostIdeas.`,
        },
      ]
    },
  },

  // 15
  'offer-clarifier': {
    aiLevel: 'heavy',
    schema: OfferClarifierSchema,
    buildMessages: (req) => {
      const messy = String(req.input.offer ?? req.input.description ?? '').trim()
      return [
        { role: 'system', content: 'You clarify offers into a clean pitch. Output JSON only.' },
        {
          role: 'user',
          content: `Clarify this offer:\n\n${messy || '(missing)'}\n\nReturn: oneLiner, bullets, whoItsFor, whoItsNotFor, pricingPositioning.`,
        },
      ]
    },
  },

  // 16
  'comment-reply-generator': {
    aiLevel: 'light',
    schema: CommentReplyGeneratorSchema,
    buildMessages: (req) => {
      const comment = String(req.input.comment ?? '').trim()
      const vibe = String(req.input.tone ?? 'calm').trim()
      return [
        { role: 'system', content: 'You write replies that drive conversation and saves. Output JSON only.' },
        {
          role: 'user',
          content: `Generate replies to this comment.\n\nCOMMENT:\n${comment || '(missing)'}\n\nTONE:\n${vibe}\n\nReturn: replies, pinnedReply, questionsToAskBack.`,
        },
      ]
    },
  },

  // 17
  'story-sequence-planner': {
    aiLevel: 'light',
    schema: StorySequencePlannerSchema,
    buildMessages: (req) => {
      const goal = String(req.input.goal ?? req.input.offer ?? '').trim()
      return [
        { role: 'system', content: 'You design IG story sequences with simple text. Output JSON only.' },
        {
          role: 'user',
          content: `Plan a story sequence to achieve this goal:\n\nGOAL:\n${goal || '(missing)'}\n\nReturn: slides[{slide,text,stickerSuggestion?}], dmPrompt.`,
        },
      ]
    },
  },

  // 18
  'carousel-outline': {
    aiLevel: 'light',
    schema: CarouselOutlineSchema,
    buildMessages: (req) => {
      const topic = String(req.input.topic ?? '').trim()
      return [
        { role: 'system', content: 'You outline carousels that get saves. Output JSON only.' },
        {
          role: 'user',
          content: `Outline a carousel.\n\nTOPIC:\n${topic || '(missing)'}\n\nReturn: title, slides[5-10], caption, saveHook.`,
        },
      ]
    },
  },

  // 19
  'audience-clarifier': {
    aiLevel: 'heavy',
    schema: AudienceClarifierSchema,
    buildMessages: (req) => {
      const niche = String(req.input.niche ?? '').trim()
      return [
        { role: 'system', content: 'You clarify audiences into real language and real pains. Output JSON only.' },
        {
          role: 'user',
          content: `Clarify the audience for:\n\nNICHE:\n${niche || '(missing)'}\n\nReturn: target, pains, desires, languageToUse, languageToAvoid.`,
        },
      ]
    },
  },

  // 20
  'competitor-angle-finder': {
    aiLevel: 'heavy',
    schema: CompetitorAngleFinderSchema,
    buildMessages: (req) => {
      const competitors = String(req.input.competitors ?? req.input.handles ?? '').trim()
      const niche = String(req.input.niche ?? '').trim()
      return [
        { role: 'system', content: 'You find angles that exploit competitor sameness. Output JSON only.' },
        {
          role: 'user',
          content: `Find angles.\n\nNICHE:\n${niche || '(missing)'}\n\nCOMPETITORS (handles/links/notes):\n${competitors || '(missing)'}\n\nReturn: competitorPatterns, gapsToExploit, angles, first3Reels.`,
        },
      ]
    },
  },
}

// ---------- Generic AI Runner ----------
async function runToolWithOpenAI(req: RunRequest, ctx: RunContext) {
  const toolId = req.toolId
  const spec = TOOL_SPECS[toolId]

  if (!spec) {
    throw new Error(`No TOOL_SPECS entry for toolId="${toolId}". Add schema + prompt.`)
  }

  const openai = getOpenAIClient()
  const model = pickModel(spec.aiLevel === 'none' ? 'light' : spec.aiLevel)

  const messages = spec.buildMessages(req, ctx)

  ctx.logger.info('openai.run.start', { toolId, model })

  // Structured Outputs via Responses API parse helper
  // This guarantees the output adheres to the Zod schema.
  const parsed = await openai.responses.parse({
    model,
    input: messages,
    text: {
      format: zodTextFormat(spec.schema, `${toolId}_output`),
    },
    // stable id for abuse detection + safety bucketing
    safety_identifier: safetyIdentifierFromUserId(ctx.user.id),
  })

  ctx.logger.info('openai.run.done', { toolId, model })

  return { output: parsed.output_parsed }
}

export const runnerRegistry: Record<string, (req: RunRequest, ctx: RunContext) => Promise<{ output: any }>> =
  Object.fromEntries(
    Object.keys(TOOL_SPECS).map((toolId) => [
      toolId,
      async (req: RunRequest, ctx: RunContext) => runToolWithOpenAI(req, ctx),
    ])
  )
