import { z } from 'zod'
import type { RunRequest } from '@/src/lib/tools/runTypes'
import type { ToolMeta } from '@/src/lib/tools/registry'
import { pickModel } from '@/src/lib/ai/openaiClient'
import { runToolAI } from '@/src/lib/ai/runToolAI'
import { hookAnalyzerBrief } from '@/src/lib/ai/toolBriefs/hook-analyzer'
import { ctaMatchAnalyzerBrief } from '@/src/lib/ai/toolBriefs/cta-match-analyzer'
import { contentAngleGeneratorBrief } from '@/src/lib/ai/toolBriefs/content-angle-generator'
import { captionOptimizerBrief } from '@/src/lib/ai/toolBriefs/caption-optimizer'
import { engagementDiagnosticBrief } from '@/src/lib/ai/toolBriefs/engagement-diagnostic'
import { EXPECTED_TOOL_IDS } from '@/src/lib/tools/registry'
import { runAIJson } from '@/src/lib/ai/openai'
import { normalizeToolOutput } from '@/src/lib/ai/normalizeOutput'
import { TOOL_AI_CONFIG, TOOL_OUTPUT_JSON_SCHEMA, TOOL_OUTPUT_ZOD } from '@/src/lib/ai/toolAiRegistry'

export type RunContext = {
  user: { id: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
  toolMeta: ToolMeta
  usage: { aiTokensRemaining: number }
  logger: { info: (msg: string, meta?: any) => void; error: (msg: string, meta?: any) => void }
}

/**
 * IMPORTANT:
 * - Responses API is used for selected tools with strict JSON validation.
 * - /api/tools/run already meters tokens; this file returns structured outputs only.
 */

// ---------- Shared Output Schemas (legacy) ----------

// 1) hook-analyzer
const HookAnalyzerSchema = z.object({
  hookScore: z.number().min(0).max(100),
  hookType: z.enum(['Curiosity', 'Direct', 'Contrarian', 'Authority', 'Story', 'Shock']),
  strongerHooks: z.array(z.string()).min(3).max(7),
  notes: z.array(z.string()).min(2).max(8),
})

// 2) cta-match-analyzer
const CtaMatchAnalyzerSchema = z.object({
  matchScore: z.number().min(0).max(100),
  mismatchReasons: z.array(z.string()).min(1).max(12),
  improvedCtas: z.array(z.string()).min(3).max(10),
})

// 3) dm-intelligence-engine
const DmIntelligenceEngineSchema = z.object({
  leadScore: z.number().min(0).max(100),
  intentSignals: z.array(z.string()).min(2).max(12),
  bestNextMessage: z.string(),
  objectionGuesses: z.array(z.string()).min(1).max(8),
  closePaths: z.array(z.string()).min(2).max(8),
  redFlags: z.array(z.string()).min(0).max(8),
})

// 4) retention-leak-finder
const RetentionLeakFinderSchema = z.object({
  leaks: z.array(z.string()).min(3).max(10),
  fixes: z.array(z.string()).min(3).max(12),
  rewriteOutline: z.array(z.string()).min(4).max(14),
  loopSuggestion: z.string(),
})

// 5) reel-script-builder
const ReelScriptBuilderSchema = z.object({
  hook: z.string(),
  beats: z.array(z.string()).min(4).max(12),
  onScreenText: z.array(z.string()).min(4).max(12),
  loopEnding: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()).min(0).max(20),
})

// 6) offer-clarity-check
const OfferClarityCheckSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  oneLiner: z.string(),
  bullets: z.array(z.string()).min(3).max(8),
  gaps: z.array(z.string()).min(1).max(10),
  strongerOfferVersion: z.string(),
})

async function runResponsesTool(toolId: string, req: RunRequest) {
  const config = TOOL_AI_CONFIG[toolId as keyof typeof TOOL_AI_CONFIG]
  const schema = TOOL_OUTPUT_ZOD[toolId as keyof typeof TOOL_OUTPUT_ZOD]
  const jsonSchema = TOOL_OUTPUT_JSON_SCHEMA[toolId as keyof typeof TOOL_OUTPUT_JSON_SCHEMA]
  const model =
    config?.model === 'mini'
      ? process.env.OPENAI_MODEL_LIGHT || 'gpt-4.1-mini'
      : process.env.OPENAI_MODEL_HEAVY || 'gpt-4.1-mini'

  const briefs: Record<string, string> = {
    'hook-analyzer': hookAnalyzerBrief,
    'cta-match-analyzer': ctaMatchAnalyzerBrief,
    'content-angle-generator': contentAngleGeneratorBrief,
    'caption-optimizer': captionOptimizerBrief,
    'engagement-diagnostic': engagementDiagnosticBrief,
  }

  const temperature = toolId === 'content-angle-generator' || toolId === 'caption-optimizer' ? 0.5 : 0.2
  const brief = briefs[toolId] || config?.system || ''

  const result = await runToolAI({
    toolId,
    input: req.input ?? {},
    schema: schema as z.ZodSchema<any>,
    jsonSchema: jsonSchema as Record<string, any> | undefined,
    model,
    temperature,
    brief,
  })

  if (!result.ok) {
    return { output: { error: result.error }, usage: { model } }
  }

  return { output: result.output, usage: result.aiMeta }
}
// 7) positioning-knife
const PositioningKnifeSchema = z.object({
  positioningStatement: z.string(),
  differentiators: z.array(z.string()).min(2).max(8),
  proofToAdd: z.array(z.string()).min(2).max(10),
  whatToCut: z.array(z.string()).min(2).max(10),
  taglineOptions: z.array(z.string()).min(3).max(8),
})

// 8) content-repurpose-machine
const ContentRepurposeMachineSchema = z.object({
  reelIdeas: z.array(z.string()).min(3).max(12),
  carouselOutline: z.array(z.string()).min(0).max(12),
  storySequence: z.array(z.string()).min(0).max(12),
  captionBank: z.array(z.string()).min(0).max(15),
})

// 9) comment-magnet
const CommentMagnetSchema = z.object({
  questions: z.array(z.string()).min(8).max(20),
  pinnedComment: z.string(),
  rulesOfThumb: z.array(z.string()).min(2).max(8),
})

// 10) profile-clarity-scan
const ProfileClarityScanSchema = z.object({
  clarityScore: z.number().min(0).max(100),
  whatWorks: z.array(z.string()).min(2).max(10),
  whatHurts: z.array(z.string()).min(2).max(10),
  improvedBio: z.string(),
  nameField: z.string(),
  profileCta: z.string(),
  pinnedPostIdeas: z.array(z.string()).min(3).max(8),
})

// 11) bio-to-cta
const BioToCtaSchema = z.object({
  ctaOptions: z.array(z.string()).min(5).max(12),
  bestPick: z.string(),
  whyItFits: z.array(z.string()).min(2).max(6),
})

// 12) carousel-blueprint
const CarouselBlueprintSchema = z.object({
  title: z.string(),
  slides: z.array(z.string()).min(5).max(12),
  saveHook: z.string(),
  caption: z.string(),
})

// 13) story-sequence-planner
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

// 14) hashtag-support-pack
const HashtagSupportPackSchema = z.object({
  hashtagSets: z
    .array(
      z.object({
        label: z.string(),
        tags: z.array(z.string()).min(10).max(25),
      })
    )
    .min(2)
    .max(6),
  usageNotes: z.array(z.string()).min(2).max(8),
})

// 15) competitor-lunch-money
const CompetitorLunchMoneySchema = z.object({
  competitorPatterns: z.array(z.string()).min(3).max(12),
  gapsToExploit: z.array(z.string()).min(3).max(12),
  angles: z.array(z.string()).min(5).max(15),
  first3Reels: z.array(z.string()).min(3).max(3),
})

// 16) analytics-signal-reader
const AnalyticsSignalReaderSchema = z.object({
  diagnosis: z.array(z.string()).min(3).max(10),
  fixes: z.array(z.string()).min(3).max(12),
  nextPostIdeas: z.array(z.string()).min(3).max(10),
  priority: z.enum(['Fix Hook', 'Fix Offer', 'Fix Targeting', 'Fix Format', 'Fix Consistency']),
})

// 17) audience-mirror
const AudienceMirrorSchema = z.object({
  target: z.string(),
  pains: z.array(z.string()).min(3).max(10),
  desires: z.array(z.string()).min(3).max(10),
  languageToUse: z.array(z.string()).min(5).max(15),
  languageToAvoid: z.array(z.string()).min(5).max(15),
})

// 18) objection-crusher
const ObjectionCrusherSchema = z.object({
  bestReply: z.string(),
  alternateReplies: z.array(z.string()).min(3).max(8),
  questionsToAsk: z.array(z.string()).min(2).max(8),
  doNotSay: z.array(z.string()).min(3).max(10),
})

// 19) launch-plan-sprinter
const LaunchPlanSprinterSchema = z.object({
  timeline: z.array(z.string()).min(5).max(20),
  dailyPosts: z.array(z.string()).min(3).max(20),
  dmPlan: z.array(z.string()).min(3).max(12),
  metricsToWatch: z.array(z.string()).min(3).max(10),
})

// 20) content-calendar-minimal
const ContentCalendarMinimalSchema = z.object({
  weeks: z
    .array(
      z.object({
        week: z.number().min(1).max(8),
        plan: z.array(z.string()).min(3).max(14),
      })
    )
    .min(1)
    .max(8),
  batchingPlan: z.array(z.string()).min(3).max(12),
})

// ---------- Tool Spec Map (locked 20 IDs) ----------
type AiLevel = 'none' | 'light' | 'heavy'
type ToolSpec = {
  aiLevel: AiLevel
  schema: z.ZodTypeAny
  buildMessages: (req: RunRequest, ctx: RunContext) => Array<{ role: 'system' | 'user'; content: string }>
}

const TOOL_SPECS: Record<string, ToolSpec> = {
  // 1) hook-analyzer
  'hook-analyzer': {
    aiLevel: 'light',
    schema: HookAnalyzerSchema,
    buildMessages: (req) => {
      const hook = String(req.input.hookText ?? req.input.hook ?? req.input.topic ?? '').trim()
      const audience = String(req.input.audience ?? '').trim()
      const format = String(req.input.format ?? 'spoken').trim()
      const platform = String(req.input.platform ?? 'instagram_reels').trim()
      const tone = String(req.input.tone ?? 'calm_confident').trim()
      const goal = String(req.input.goal ?? 'watch_time').trim()
      return [
        {
          role: 'system',
          content:
            'You are an elite short-form hook editor. Output must match the provided JSON schema. No extra text.',
        },
        {
          role: 'user',
          content: `Analyze and improve this hook.\n\nPLATFORM:\n${platform}\n\nFORMAT:\n${format}\n\nTONE:\n${tone}\n\nGOAL:\n${goal}\n\nAUDIENCE:\n${audience || '(unspecified)'}\n\nHOOK:\n${hook || '(missing hook)'}\n\nReturn: hookScore, hookType, strongerHooks, notes.`,
        },
      ]
    },
  },

  // 2) cta-match-analyzer
  'cta-match-analyzer': {
    aiLevel: 'light',
    schema: CtaMatchAnalyzerSchema,
    buildMessages: (req) => {
      const summary = String(req.input.contentSummary ?? '').trim()
      const cta = String(req.input.ctaText ?? req.input.cta ?? '').trim()
      const offerType = String(req.input.offerType ?? '').trim()
      const platform = String(req.input.platform ?? 'instagram_reels').trim()
      const contentType = String(req.input.contentType ?? 'reel').trim()
      const desiredAction = String(req.input.desiredAction ?? '').trim()
      return [
        { role: 'system', content: 'You are a conversion strategist. Output JSON matching schema only.' },
        {
          role: 'user',
          content: `Score CTA-to-content match.\n\nPLATFORM:\n${platform}\n\nCONTENT TYPE:\n${contentType}\n\nDESIRED ACTION:\n${desiredAction || '(missing)'}\n\nCONTENT SUMMARY:\n${summary || '(missing)'}\n\nOFFER TYPE:\n${offerType || '(missing)'}\n\nCTA:\n${cta || '(missing)'}\n\nReturn: matchScore, mismatchReasons, improvedCtas.`,
        },
      ]
    },
  },

  // 3) dm-intelligence-engine
  'dm-intelligence-engine': {
    aiLevel: 'heavy',
    schema: DmIntelligenceEngineSchema,
    buildMessages: (req) => {
      const leadMessage = String(req.input.leadMessage ?? '').trim()
      const goal = String(req.input.goal ?? '').trim()
      const tone = String(req.input.tone ?? 'calm').trim()
      const offerOneLiner = String(req.input.offerOneLiner ?? '').trim()

      return [
        { role: 'system', content: 'You are a DM conversion strategist. Output JSON only. No extra text.' },
        {
          role: 'user',
          content: `Analyze the lead message and write the best next response.\n\nGOAL:\n${goal || '(missing)'}\n\nTONE:\n${tone}\n\nOFFER ONE-LINER:\n${offerOneLiner || '(none provided)'}\n\nTHEIR MESSAGE:\n${leadMessage || '(missing)'}\n\nReturn: leadScore, intentSignals, bestNextMessage, objectionGuesses, closePaths, redFlags.`,
        },
      ]
    },
  },

  // 4) retention-leak-finder
  'retention-leak-finder': {
    aiLevel: 'light',
    schema: RetentionLeakFinderSchema,
    buildMessages: (req) => {
      const script = String(req.input.reelScript ?? '').trim()
      const lengthSeconds = Number(req.input.lengthSeconds ?? 0)
      const targetAction = String(req.input.targetAction ?? 'save').trim()
      return [
        { role: 'system', content: 'You find retention leaks in short-form scripts. Output JSON only.' },
        {
          role: 'user',
          content: `Find retention leaks and fixes.\n\nTARGET ACTION:\n${targetAction}\n\nLENGTH (seconds):\n${Number.isFinite(lengthSeconds) && lengthSeconds > 0 ? lengthSeconds : '(unknown)'}\n\nSCRIPT/OUTLINE:\n${script || '(missing)'}\n\nReturn: leaks, fixes, rewriteOutline, loopSuggestion.`,
        },
      ]
    },
  },

  // 5) reel-script-builder
  'reel-script-builder': {
    aiLevel: 'heavy',
    schema: ReelScriptBuilderSchema,
    buildMessages: (req) => {
      const topic = String(req.input.topic ?? '').trim()
      const angle = String(req.input.angle ?? 'truth').trim()
      const lengthSeconds = Number(req.input.lengthSeconds ?? 15)

      return [
        { role: 'system', content: 'You write retention-optimized Reels scripts. Output JSON only.' },
        {
          role: 'user',
          content: `Write a Reel script built for rewatches.\n\nTOPIC:\n${topic || '(missing)'}\n\nANGLE:\n${angle}\n\nTARGET LENGTH (seconds):\n${Number.isFinite(lengthSeconds) ? lengthSeconds : 15}\n\nReturn: hook, beats, onScreenText, loopEnding, caption, hashtags.`,
        },
      ]
    },
  },

  // 6) offer-clarity-check
  'offer-clarity-check': {
    aiLevel: 'heavy',
    schema: OfferClarityCheckSchema,
    buildMessages: (req) => {
      const offer = String(req.input.offer ?? '').trim()
      const audience = String(req.input.audience ?? '').trim()
      const price = String(req.input.price ?? '').trim()
      return [
        { role: 'system', content: 'You clarify offers into clean, buyer-friendly language. Output JSON only.' },
        {
          role: 'user',
          content: `Improve this offer clarity.\n\nAUDIENCE:\n${audience || '(missing)'}\n\nPRICE (optional):\n${price || '(not provided)'}\n\nOFFER:\n${offer || '(missing)'}\n\nReturn: clarityScore, oneLiner, bullets, gaps, strongerOfferVersion.`,
        },
      ]
    },
  },

  // 7) positioning-knife
  'positioning-knife': {
    aiLevel: 'heavy',
    schema: PositioningKnifeSchema,
    buildMessages: (req) => {
      const whatYouDo = String(req.input.whatYouDo ?? '').trim()
      const whoFor = String(req.input.whoFor ?? '').trim()
      const proof = String(req.input.proof ?? '').trim()

      return [
        { role: 'system', content: 'You tighten positioning without hype. Output JSON only.' },
        {
          role: 'user',
          content: `Tighten positioning.\n\nWHAT THEY DO:\n${whatYouDo || '(missing)'}\n\nWHO IT IS FOR:\n${whoFor || '(missing)'}\n\nPROOF (optional):\n${proof || '(none)'}\n\nReturn: positioningStatement, differentiators, proofToAdd, whatToCut, taglineOptions.`,
        },
      ]
    },
  },

  // 8) content-repurpose-machine
  'content-repurpose-machine': {
    aiLevel: 'light',
    schema: ContentRepurposeMachineSchema,
    buildMessages: (req) => {
      const source = String(req.input.source ?? '').trim()
      const outputs = Array.isArray(req.input.outputs) ? req.input.outputs.map(String) : []
      return [
        { role: 'system', content: 'You repurpose one idea into multiple formats. Output JSON only.' },
        {
          role: 'user',
          content: `Repurpose this source content.\n\nREQUESTED OUTPUTS:\n${outputs.length ? outputs.join(', ') : '(none specified)'}\n\nSOURCE:\n${source || '(missing)'}\n\nReturn: reelIdeas, carouselOutline, storySequence, captionBank. If a requested output is not requested, it can be an empty array.`,
        },
      ]
    },
  },

  // 9) comment-magnet
  'comment-magnet': {
    aiLevel: 'light',
    schema: CommentMagnetSchema,
    buildMessages: (req) => {
      const postTopic = String(req.input.postTopic ?? '').trim()
      return [
        { role: 'system', content: 'You generate comment-driving questions without cringe. Output JSON only.' },
        {
          role: 'user',
          content: `Generate comment prompts for this topic.\n\nTOPIC:\n${postTopic || '(missing)'}\n\nReturn: questions, pinnedComment, rulesOfThumb.`,
        },
      ]
    },
  },

  // 10) profile-clarity-scan
  'profile-clarity-scan': {
    aiLevel: 'light',
    schema: ProfileClarityScanSchema,
    buildMessages: (req) => {
      const bio = String(req.input.bio ?? '').trim()
      const link = String(req.input.link ?? '').trim()
      const offer = String(req.input.offer ?? '').trim()
      return [
        { role: 'system', content: 'You audit IG profiles for clarity + clicks. Output JSON only.' },
        {
          role: 'user',
          content: `Audit this profile.\n\nBIO:\n${bio || '(missing)'}\n\nLINK DESTINATION:\n${link || '(none)'}\n\nPRIMARY OFFER:\n${offer || '(none)'}\n\nReturn: clarityScore, whatWorks, whatHurts, improvedBio, nameField, profileCta, pinnedPostIdeas.`,
        },
      ]
    },
  },

  // 11) bio-to-cta
  'bio-to-cta': {
    aiLevel: 'light',
    schema: BioToCtaSchema,
    buildMessages: (req) => {
      const bio = String(req.input.bio ?? '').trim()
      return [
        { role: 'system', content: 'You extract clean CTAs from bios. Output JSON only.' },
        {
          role: 'user',
          content: `Create CTA options based on this bio.\n\nBIO:\n${bio || '(missing)'}\n\nReturn: ctaOptions, bestPick, whyItFits.`,
        },
      ]
    },
  },

  // 12) carousel-blueprint
  'carousel-blueprint': {
    aiLevel: 'light',
    schema: CarouselBlueprintSchema,
    buildMessages: (req) => {
      const topic = String(req.input.topic ?? '').trim()
      const slides = Number(req.input.slides ?? 8)
      return [
        { role: 'system', content: 'You outline carousels that get saves. Output JSON only.' },
        {
          role: 'user',
          content: `Create a carousel blueprint.\n\nTOPIC:\n${topic || '(missing)'}\n\nSLIDE COUNT:\n${Number.isFinite(slides) ? slides : 8}\n\nReturn: title, slides, saveHook, caption.`,
        },
      ]
    },
  },

  // 13) story-sequence-planner
  'story-sequence-planner': {
    aiLevel: 'light',
    schema: StorySequencePlannerSchema,
    buildMessages: (req) => {
      const goal = String(req.input.goal ?? '').trim()
      const context = String(req.input.context ?? '').trim()
      return [
        { role: 'system', content: 'You design IG story sequences that feel natural. Output JSON only.' },
        {
          role: 'user',
          content: `Plan an IG story sequence.\n\nGOAL:\n${goal || '(missing)'}\n\nCONTEXT (optional):\n${context || '(none)'}\n\nReturn: slides[{slide,text,stickerSuggestion?}], dmPrompt.`,
        },
      ]
    },
  },

  // 14) hashtag-support-pack
  'hashtag-support-pack': {
    aiLevel: 'light',
    schema: HashtagSupportPackSchema,
    buildMessages: (req) => {
      const topic = String(req.input.topic ?? '').trim()
      const niche = String(req.input.niche ?? '').trim()
      return [
        { role: 'system', content: 'You provide supportive hashtag sets. Output JSON only.' },
        {
          role: 'user',
          content: `Create supportive hashtag sets.\n\nNICHE:\n${niche || '(missing)'}\n\nTOPIC:\n${topic || '(missing)'}\n\nReturn: hashtagSets[{label,tags[10-25]}], usageNotes.`,
        },
      ]
    },
  },

  // 15) competitor-lunch-money
  'competitor-lunch-money': {
    aiLevel: 'heavy',
    schema: CompetitorLunchMoneySchema,
    buildMessages: (req) => {
      const competitorHandle = String(req.input.competitorHandle ?? '').trim()
      const yourAngle = String(req.input.yourAngle ?? '').trim()
      return [
        { role: 'system', content: 'You reverse-engineer competitors into exploitable gaps. Output JSON only.' },
        {
          role: 'user',
          content: `Reverse-engineer this competitor.\n\nCOMPETITOR:\n${competitorHandle || '(missing)'}\n\nYOUR ADVANTAGE (optional):\n${yourAngle || '(none)'}\n\nReturn: competitorPatterns, gapsToExploit, angles, first3Reels.`,
        },
      ]
    },
  },

  // 16) analytics-signal-reader
  'analytics-signal-reader': {
    aiLevel: 'heavy',
    schema: AnalyticsSignalReaderSchema,
    buildMessages: (req) => {
      const last30 = String(req.input.last30 ?? '').trim()
      const priority = String(req.input.priority ?? 'watch_time').trim()
      return [
        { role: 'system', content: 'You turn IG analytics into actionable next steps. Output JSON only.' },
        {
          role: 'user',
          content: `Analyze these metrics.\n\nPRIORITY:\n${priority}\n\nLAST 30 DAYS METRICS (paste):\n${last30 || '(missing)'}\n\nReturn: diagnosis, fixes, nextPostIdeas, priority (enum).`,
        },
      ]
    },
  },

  // 17) audience-mirror
  'audience-mirror': {
    aiLevel: 'heavy',
    schema: AudienceMirrorSchema,
    buildMessages: (req) => {
      const audience = String(req.input.audience ?? '').trim()
      return [
        { role: 'system', content: 'You clarify audiences into real pains and real language. Output JSON only.' },
        {
          role: 'user',
          content: `Clarify this audience.\n\nAUDIENCE:\n${audience || '(missing)'}\n\nReturn: target, pains, desires, languageToUse, languageToAvoid.`,
        },
      ]
    },
  },

  // 18) objection-crusher
  'objection-crusher': {
    aiLevel: 'heavy',
    schema: ObjectionCrusherSchema,
    buildMessages: (req) => {
      const objection = String(req.input.objection ?? '').trim()
      const offer = String(req.input.offer ?? '').trim()
      const channel = String(req.input.channel ?? 'dm').trim()
      return [
        { role: 'system', content: 'You handle objections calmly and confidently. Output JSON only.' },
        {
          role: 'user',
          content: `Write the best response to this objection.\n\nCHANNEL:\n${channel}\n\nOFFER (optional):\n${offer || '(none)'}\n\nOBJECTION:\n${objection || '(missing)'}\n\nReturn: bestReply, alternateReplies, questionsToAsk, doNotSay.`,
        },
      ]
    },
  },

  // 19) launch-plan-sprinter
  'launch-plan-sprinter': {
    aiLevel: 'heavy',
    schema: LaunchPlanSprinterSchema,
    buildMessages: (req) => {
      const offer = String(req.input.offer ?? '').trim()
      const timeframe = String(req.input.timeframe ?? '').trim()
      return [
        { role: 'system', content: 'You build realistic launch plans. Output JSON only.' },
        {
          role: 'user',
          content: `Create a launch plan.\n\nTIMEFRAME:\n${timeframe || '(missing)'}\n\nOFFER:\n${offer || '(missing)'}\n\nReturn: timeline, dailyPosts, dmPlan, metricsToWatch.`,
        },
      ]
    },
  },

  // 20) content-calendar-minimal
  'content-calendar-minimal': {
    aiLevel: 'heavy',
    schema: ContentCalendarMinimalSchema,
    buildMessages: (req) => {
      const topicPillars = String(req.input.topicPillars ?? '').trim()
      const postsPerWeek = Number(req.input.postsPerWeek ?? 5)

      return [
        { role: 'system', content: 'You create simple content calendars that people actually follow. Output JSON only.' },
        {
          role: 'user',
          content: `Create a minimal, repeatable weekly content plan.\n\nTOPIC PILLARS:\n${topicPillars || '(missing)'}\n\nPOSTS PER WEEK:\n${Number.isFinite(postsPerWeek) ? postsPerWeek : 5}\n\nReturn: weeks[{week,plan[]}], batchingPlan.`,
        },
      ]
    },
  },

  // 21) content-angle-generator
  'content-angle-generator': {
    aiLevel: 'light',
    schema: z.object({}),
    buildMessages: (req) => {
      const platform = String(req.input.platform ?? 'instagram_reels').trim()
      const topic = String(req.input.topic ?? '').trim()
      const audience = String(req.input.audience ?? '').trim()
      const voice = String(req.input.voice ?? '').trim()
      const constraints = Array.isArray(req.input.constraints) ? req.input.constraints : []
      const outputCount = String(req.input.outputCount ?? '10').trim()
      return [
        { role: 'system', content: 'You generate distinct content angles. Output JSON only.' },
        {
          role: 'user',
          content: `Generate scroll-stopping angles.\n\nPLATFORM:\n${platform}\n\nTOPIC:\n${topic || '(missing)'}\n\nAUDIENCE:\n${audience || '(missing)'}\n\nVOICE:\n${voice || '(none)'}\n\nCONSTRAINTS:\n${constraints.length ? constraints.join(', ') : '(none)'}\n\nCOUNT:\n${outputCount}\n\nReturn: angles (list), notes.`,
        },
      ]
    },
  },

  // 22) caption-optimizer
  'caption-optimizer': {
    aiLevel: 'light',
    schema: z.object({}),
    buildMessages: (req) => {
      const platform = String(req.input.platform ?? 'instagram_reels').trim()
      const postType = String(req.input.postType ?? 'reel').trim()
      const hook = String(req.input.hook ?? '').trim()
      const rawCaption = String(req.input.rawCaption ?? '').trim()
      const ctaGoal = String(req.input.ctaGoal ?? '').trim()
      const style = String(req.input.style ?? '').trim()
      const forbidden = String(req.input.forbidden ?? '').trim()
      return [
        { role: 'system', content: 'You optimize captions for clarity and conversion. Output JSON only.' },
        {
          role: 'user',
          content: `Optimize this caption.\n\nPLATFORM:\n${platform}\n\nPOST TYPE:\n${postType}\n\nHOOK (optional):\n${hook || '(none)'}\n\nCTA GOAL:\n${ctaGoal || '(missing)'}\n\nSTYLE:\n${style || '(none)'}\n\nAVOID:\n${forbidden || '(none)'}\n\nCAPTION:\n${rawCaption || '(missing)'}\n\nReturn: optimizedCaption, improvements, notes.`,
        },
      ]
    },
  },

  // 23) engagement-diagnostic
  'engagement-diagnostic': {
    aiLevel: 'heavy',
    schema: z.object({}),
    buildMessages: (req) => {
      const platform = String(req.input.platform ?? 'instagram_reels').trim()
      const content = String(req.input.contentLinkOrTranscript ?? '').trim()
      const goal = String(req.input.goal ?? '').trim()
      const offer = String(req.input.offer ?? '').trim()
      const audience = String(req.input.audience ?? '').trim()
      const metrics = {
        views: req.input.views,
        avgWatchTimeSeconds: req.input.avgWatchTimeSeconds,
        likes: req.input.likes,
        comments: req.input.comments,
        saves: req.input.saves,
        followsFromPost: req.input.followsFromPost,
      }
      return [
        { role: 'system', content: 'You diagnose engagement issues across hook, retention, positioning, and CTA. Output JSON only.' },
        {
          role: 'user',
          content: `Diagnose this content.\n\nPLATFORM:\n${platform}\n\nGOAL:\n${goal || '(missing)'}\n\nOFFER:\n${offer || '(none)'}\n\nAUDIENCE:\n${audience || '(missing)'}\n\nCONTENT:\n${content || '(missing)'}\n\nMETRICS:\n${JSON.stringify(metrics)}\n\nReturn: diagnosis, topIssues, fixes, notes.`,
        },
      ]
    },
  },
}

function assertToolSpecsAligned() {
  const specIds = Object.keys(TOOL_SPECS)
  const expectedSet = new Set(EXPECTED_TOOL_IDS as readonly string[])
  const missing = EXPECTED_TOOL_IDS.filter((id) => !specIds.includes(id))
  const extra = specIds.filter((id) => !expectedSet.has(id))
  if (missing.length || extra.length) {
    throw new Error(
      [
        'TOOL_SPECS keys are NOT aligned with EXPECTED_TOOL_IDS.',
        missing.length ? `Missing TOOL_SPECS: ${missing.join(', ')}` : null,
        extra.length ? `Extra TOOL_SPECS: ${extra.join(', ')}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    )
  }
}

assertToolSpecsAligned()

const TOOL_OUTPUT_FIELDS: Record<string, string[]> = {
  'hook-analyzer': ['hookScore', 'hookType', 'strongerHooks', 'notes'],
  'cta-match-analyzer': ['matchScore', 'mismatchReasons', 'improvedCtas'],
  'content-angle-generator': ['angles', 'notes'],
  'caption-optimizer': ['optimizedCaption', 'improvements', 'notes'],
  'engagement-diagnostic': ['diagnosis', 'topIssues', 'fixes', 'notes'],
  'dm-intelligence-engine': [
    'leadScore',
    'intentSignals',
    'bestNextMessage',
    'objectionGuesses',
    'closePaths',
    'redFlags',
  ],
  'retention-leak-finder': ['leaks', 'fixes', 'rewriteOutline', 'loopSuggestion'],
  'reel-script-builder': ['hook', 'beats', 'onScreenText', 'loopEnding', 'caption', 'hashtags'],
  'offer-clarity-check': ['clarityScore', 'oneLiner', 'bullets', 'gaps', 'strongerOfferVersion'],
  'positioning-knife': ['positioningStatement', 'differentiators', 'proofToAdd', 'whatToCut', 'taglineOptions'],
  'content-repurpose-machine': ['reelIdeas', 'carouselOutline', 'storySequence', 'captionBank'],
  'comment-magnet': ['questions', 'pinnedComment', 'rulesOfThumb'],
  'profile-clarity-scan': [
    'clarityScore',
    'whatWorks',
    'whatHurts',
    'improvedBio',
    'nameField',
    'profileCta',
    'pinnedPostIdeas',
  ],
  'bio-to-cta': ['ctaOptions', 'bestPick', 'whyItFits'],
  'carousel-blueprint': ['title', 'slides', 'saveHook', 'caption'],
  'story-sequence-planner': ['slides', 'dmPrompt'],
  'hashtag-support-pack': ['hashtagSets', 'usageNotes'],
  'competitor-lunch-money': ['competitorPatterns', 'gapsToExploit', 'angles', 'first3Reels'],
  'audience-mirror': ['target', 'pains', 'desires', 'languageToUse', 'languageToAvoid'],
  'objection-crusher': ['bestReply', 'alternateReplies', 'questionsToAsk', 'doNotSay'],
  'launch-plan-sprinter': ['timeline', 'dailyPosts', 'dmPlan', 'metricsToWatch'],
  'content-calendar-minimal': ['weeks', 'batchingPlan'],
}

// ---------- Generic AI Runner (JSON-only) ----------
async function runToolWithAIJson(req: RunRequest, ctx: RunContext) {
  const toolId = req.toolId
  const spec = TOOL_SPECS[toolId]

  if (!spec) {
    throw new Error(`No TOOL_SPECS entry for toolId="${toolId}". Add schema + prompt.`)
  }

  const model = pickModel(spec.aiLevel === 'none' ? 'light' : spec.aiLevel)
  const messages = spec.buildMessages(req, ctx)

  const systemBase = messages
    .filter((m) => m.role === 'system')
    .map((m) => m.content)
    .join('\n')
  const userBase = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content)
    .join('\n\n')

  const toolFields = TOOL_OUTPUT_FIELDS[toolId] ?? []

  const system = [
    systemBase,
    '',
    'Return ONLY valid JSON. No markdown. No backticks. No extra keys.',
    'Gold-standard JSON output schema:',
    '{',
    '  "summary": { "headline": string, "keyInsight": string, "confidence": "low"|"medium"|"high" },',
    '  "recommendations": string[5-10],',
    '  "nextSteps": { "plan": string[3-7], "timeframe": string },',
    '  "stopDoing": string[3-7],',
    '  "toolOutput": { ... },',
    '  "notes": string[]',
    '}',
    toolFields.length
      ? `toolOutput must include fields: ${toolFields.join(', ')}`
      : 'toolOutput can include any relevant structured fields for this tool.',
    'If input is missing/weak, say so in summary.keyInsight and add notes; still provide best-effort guidance.',
  ]
    .filter(Boolean)
    .join('\n')

  const user = [
    userBase,
    '',
    'If input is missing or weak, explain what is missing inside summary.keyInsight and still provide best-effort guidance.',
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.2,
    model,
  })

  if ('error' in result) {
    return { output: { error: result.error } }
  }

  return { output: result }
}

const analyticsSignalReaderRunner = async (req: RunRequest) => {
  const rawMetrics = String(req.input.last30 ?? '').trim()
  const priority = String(req.input.priority ?? 'watch_time').trim()

  const metricsMissing = !rawMetrics || rawMetrics.length < 40
  const missingNotes = [
    'Paste last 10 posts metrics (views, avg watch time, completion rate).',
    'Include follows gained, profile visits, saves, shares per post.',
    'Add topic/format for each post (hook style, length, CTA).',
  ]

  const system = [
    'You are an Instagram growth analyst in 2026 (Reels-first, retention-obsessed).',
    'You must output ONLY valid JSON matching the schema below.',
    'No markdown, no extra keys, no backticks.',
    '',
    'Output schema:',
    '{',
    '  "summary": {',
    '    "primaryIssue": "reach|retention|conversion|positioning|consistency|unknown",',
    '    "confidence": number (0.0-1.0),',
    '    "oneSentenceDiagnosis": string',
    '  },',
    '  "signals": [',
    '    { "signal": string, "evidence": string, "severity": "low|med|high" }',
    '  ],',
    '  "prioritizedFixes": [',
    '    { "title": string, "why": string, "how": string[], "impact": "low|med|high", "effort": "low|med|high" }',
    '  ],',
    '  "next7Days": [',
    '    { "day": 1-7, "reelIdea": string, "hook": string, "shotPlan": string[], "cta": "save|follow|dm|comment" }',
    '  ],',
    '  "stopDoing": string[],',
    '  "experiment": { "name": string, "hypothesis": string, "steps": string[], "successMetric": string },',
    '  "notes": string[]',
    '}',
  ].join('\n')

  const user = [
    `Priority focus: ${priority || 'watch_time'}`,
    `Missing input: ${metricsMissing ? missingNotes.join(' ') : 'None'}`,
    'Metrics/notes (messy paste allowed):',
    rawMetrics || '(missing metrics)',
    '',
    'Analyze signals, diagnose issues, and produce actionable fixes.',
    'If something is missing, mention it in notes and proceed with best-effort.',
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.25,
    model: pickModel('heavy'),
  })

  if ('error' in result) {
    return { output: { error: result.error } }
  }

  return { output: normalizeToolOutput('analytics-signal-reader', result) }
}

const dmIntelligenceEngineRunner = async (req: RunRequest) => {
  const leadMessage = String(req.input.leadMessage ?? '').trim()
  const goal = String(req.input.goal ?? '').trim()
  const tone = String(req.input.tone ?? 'calm').trim()
  const offerOneLiner = String(req.input.offerOneLiner ?? '').trim()

  const system = [
    'You are a DM conversion strategist in 2026.',
    'Return ONLY valid JSON matching the schema below.',
    'No markdown, no extra keys, no backticks.',
    '',
    'Output schema:',
    '{',
    '  "context": { "leadType": "cold|warm|hot|unknown", "intent": "info|price|proof|objection|ready|unknown" },',
    '  "bestReply": { "message": string, "tone": "calm|direct|friendly|professional", "length": "short|medium" },',
    '  "alternatives": [',
    '    { "label": "softer", "message": string },',
    '    { "label": "firmer", "message": string },',
    '    { "label": "qualify", "message": string }',
    '  ],',
    '  "nextQuestions": [string,string,string],',
    '  "doNotSay": [string,string,string],',
    '  "followUpPlan": [',
    '    { "when": "same_day|24h|48h", "message": string }',
    '  ]',
    '}',
  ].join('\n')

  const user = [
    `Goal: ${goal || '(missing)'}`,
    `Tone: ${tone || 'calm'}`,
    `Offer one-liner: ${offerOneLiner || '(missing)'}`,
    `Missing input: ${leadMessage ? 'None' : 'Lead message'}`,
    '',
    'Lead message:',
    leadMessage || '(missing lead message)',
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.3,
    model: pickModel('heavy'),
  })

  if ('error' in result) {
    return { output: { error: result.error } }
  }

  return { output: normalizeToolOutput('dm-intelligence-engine', result) }
}

const offerClarityCheckRunner = async (req: RunRequest) => {
  const offer = String(req.input.offer ?? '').trim()
  const audience = String(req.input.audience ?? '').trim()
  const price = String(req.input.price ?? '').trim()

  const system = [
    'You are a direct-response offer clarity strategist in 2026.',
    'Return ONLY valid JSON matching the schema below.',
    'No markdown, no extra keys, no backticks.',
    '',
    'Output schema:',
    '{',
    '  "score": { "clarity": 0-100, "specificity": 0-100, "believability": 0-100 },',
    '  "diagnosis": { "confusingParts": string[], "missingInfo": string[], "risk": "low|med|high" },',
    '  "rewrites": [',
    '    { "format": "one_liner", "text": string },',
    '    { "format": "two_lines", "text": string },',
    '    { "format": "bullet_offer", "text": string }',
    '  ],',
    '  "proofToAdd": [string,string,string],',
    '  "pricingFrame": [string,string],',
    '  "ctaOptions": [string,string,string]',
    '}',
  ].join('\n')

  const user = [
    `Audience: ${audience || '(missing)'}`,
    `Price: ${price || '(missing)'}`,
    `Missing input: ${offer ? 'None' : 'Offer description'}`,
    '',
    'Offer:',
    offer || '(missing offer description)',
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.3,
    model: pickModel('heavy'),
  })

  if ('error' in result) {
    return { output: { error: result.error } }
  }

  return { output: normalizeToolOutput('offer-clarity-check', result) }
}

const reelScriptBuilderRunner = async (req: RunRequest) => {
  const topic = String(req.input.topic ?? '').trim()
  const angle = String(req.input.angle ?? '').trim()
  const lengthSeconds = Number(req.input.lengthSeconds ?? 15)

  const system = [
    'You are a Reels scriptwriter in 2026 focused on retention.',
    'Return ONLY valid JSON matching the schema below.',
    'No markdown, no extra keys, no backticks.',
    '',
    'Output schema:',
    '{',
    '  "hookOptions": [string,string,string],',
    '  "script": {',
    '    "onScreen": [string,string,string,string],',
    '    "voiceover": [string,string,string,string]',
    '  },',
    '  "shotPlan": [string,string,string,string],',
    '  "loopEnding": string,',
    '  "caption": string,',
    '  "cta": "save|follow|comment|dm",',
    '  "hashtags": [string,string,string,string,string,string,string,string,string,string]',
    '}',
  ].join('\n')

  const user = [
    `Topic: ${topic || '(missing)'}`,
    `Angle: ${angle || 'truth'}`,
    `Length (seconds): ${Number.isFinite(lengthSeconds) ? lengthSeconds : 15}`,
    `Missing input: ${topic ? 'None' : 'Topic'}`,
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.3,
    model: pickModel('heavy'),
  })

  if ('error' in result) {
    return { output: { error: result.error } }
  }

  return { output: normalizeToolOutput('reel-script-builder', result) }
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  'cta-match-analyzer': 'a CTA alignment auditor for short-form content',
  'retention-leak-finder': 'a retention leak analyst for Reels scripts',
  'positioning-knife': 'a positioning strategist who sharpens differentiation',
  'content-repurpose-machine': 'a content repurposing strategist',
  'comment-magnet': 'a comment-driving prompt strategist',
  'profile-clarity-scan': 'a profile clarity auditor for Instagram',
  'bio-to-cta': 'a bio-to-CTA conversion editor',
  'carousel-blueprint': 'a carousel outline strategist',
  'story-sequence-planner': 'an Instagram story sequence planner',
  'hashtag-support-pack': 'a hashtag research assistant',
  'competitor-lunch-money': 'a competitor gap analyst',
  'audience-mirror': 'an audience research strategist',
  'objection-crusher': 'an objection-handling copywriter',
  'launch-plan-sprinter': 'a launch plan strategist',
  'content-calendar-minimal': 'a minimalist content calendar strategist',
}

function formatInputForPrompt(input: Record<string, any>) {
  return Object.entries(input)
    .map(([key, value]) => {
      if (value === null || value === undefined || value === '') return `${key}: (missing)`
      if (typeof value === 'string') return `${key}: ${value}`
      return `${key}: ${JSON.stringify(value)}`
    })
    .join('\n')
}

async function runStructuredToolRunner(toolId: string, req: RunRequest) {
  const description = TOOL_DESCRIPTIONS[toolId] || 'a strategy assistant'
  const toolFields = TOOL_OUTPUT_FIELDS[toolId] ?? []
  const model = pickModel(TOOL_SPECS[toolId]?.aiLevel === 'none' ? 'light' : TOOL_SPECS[toolId]?.aiLevel || 'heavy')

  const system = [
    `You are ${description}.`,
    'Return ONLY valid JSON. No markdown, no extra keys, no backticks.',
    'Output schema:',
    '{',
    '  "summary": "1-2 sentences",',
    '  "recommendations": [5-10 actionable strings],',
    '  "nextSteps": { "steps": string[] },',
    '  "stopDoing": [3 strings],',
    '  "experiment": { "name": string, "hypothesis": string, "steps": string[], "successMetric": string },',
    '  "toolOutput": { ... }',
    '}',
    toolFields.length
      ? `toolOutput must include fields: ${toolFields.join(', ')}`
      : 'toolOutput can include any relevant structured fields for this tool.',
    'If inputs are weak or missing, say so in summary and still provide best-effort guidance.',
  ].join('\n')

  const user = [
    'Inputs (messy allowed):',
    formatInputForPrompt(req.input ?? {}),
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.3,
    model,
  })

  if ('error' in result) {
    return { output: { error: result.error } }
  }

  return { output: normalizeToolOutput(toolId, result) }
}

const ctaMatchAnalyzerRunner = (req: RunRequest) => runResponsesTool('cta-match-analyzer', req)
const retentionLeakFinderRunner = (req: RunRequest) => runStructuredToolRunner('retention-leak-finder', req)
const positioningKnifeRunner = (req: RunRequest) => runStructuredToolRunner('positioning-knife', req)
const contentRepurposeMachineRunner = (req: RunRequest) => runStructuredToolRunner('content-repurpose-machine', req)
const commentMagnetRunner = (req: RunRequest) => runStructuredToolRunner('comment-magnet', req)
const profileClarityScanRunner = (req: RunRequest) => runStructuredToolRunner('profile-clarity-scan', req)
const bioToCtaRunner = (req: RunRequest) => runStructuredToolRunner('bio-to-cta', req)
const carouselBlueprintRunner = (req: RunRequest) => runStructuredToolRunner('carousel-blueprint', req)
const storySequencePlannerRunner = (req: RunRequest) => runStructuredToolRunner('story-sequence-planner', req)
const hashtagSupportPackRunner = (req: RunRequest) => runStructuredToolRunner('hashtag-support-pack', req)
const competitorLunchMoneyRunner = (req: RunRequest) => runStructuredToolRunner('competitor-lunch-money', req)
const audienceMirrorRunner = (req: RunRequest) => runStructuredToolRunner('audience-mirror', req)
const objectionCrusherRunner = (req: RunRequest) => runStructuredToolRunner('objection-crusher', req)
const launchPlanSprinterRunner = (req: RunRequest) => runStructuredToolRunner('launch-plan-sprinter', req)
const contentCalendarMinimalRunner = (req: RunRequest) => runStructuredToolRunner('content-calendar-minimal', req)

const hookAnalyzerResponsesRunner = (req: RunRequest) => runResponsesTool('hook-analyzer', req)
const contentAngleGeneratorRunner = (req: RunRequest) => runResponsesTool('content-angle-generator', req)
const captionOptimizerRunner = (req: RunRequest) => runResponsesTool('caption-optimizer', req)
const engagementDiagnosticRunner = (req: RunRequest) => runResponsesTool('engagement-diagnostic', req)

const customRunners: Record<string, (req: RunRequest, ctx: RunContext) => Promise<{ output: any }>> = {
  'analytics-signal-reader': analyticsSignalReaderRunner,
  'hook-analyzer': hookAnalyzerResponsesRunner,
  'dm-intelligence-engine': dmIntelligenceEngineRunner,
  'offer-clarity-check': offerClarityCheckRunner,
  'reel-script-builder': reelScriptBuilderRunner,
  'cta-match-analyzer': ctaMatchAnalyzerRunner,
  'retention-leak-finder': retentionLeakFinderRunner,
  'positioning-knife': positioningKnifeRunner,
  'content-repurpose-machine': contentRepurposeMachineRunner,
  'comment-magnet': commentMagnetRunner,
  'profile-clarity-scan': profileClarityScanRunner,
  'bio-to-cta': bioToCtaRunner,
  'carousel-blueprint': carouselBlueprintRunner,
  'story-sequence-planner': storySequencePlannerRunner,
  'hashtag-support-pack': hashtagSupportPackRunner,
  'competitor-lunch-money': competitorLunchMoneyRunner,
  'audience-mirror': audienceMirrorRunner,
  'objection-crusher': objectionCrusherRunner,
  'launch-plan-sprinter': launchPlanSprinterRunner,
  'content-calendar-minimal': contentCalendarMinimalRunner,
  'content-angle-generator': contentAngleGeneratorRunner,
  'caption-optimizer': captionOptimizerRunner,
  'engagement-diagnostic': engagementDiagnosticRunner,
}

export const runnerRegistry: Record<string, (req: RunRequest, ctx: RunContext) => Promise<{ output: any }>> =
  Object.fromEntries(
    EXPECTED_TOOL_IDS.map((toolId) => [
      toolId,
      async (req: RunRequest, ctx: RunContext) => {
        const runner = customRunners[toolId]
        return runner ? runner(req, ctx) : runToolWithAIJson(req, ctx)
      },
    ])
  )
