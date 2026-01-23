import { z } from 'zod'
import type { RunRequest } from '@/src/lib/tools/runTypes'
import type { ToolMeta } from '@/src/lib/tools/registry'
import { pickModel } from '@/src/lib/ai/openaiClient'
import { EXPECTED_TOOL_IDS } from '@/src/lib/tools/registry'
import { runAIJson } from '@/src/lib/ai/openai'

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

// ---------- Shared Output Schemas (locked 20) ----------

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
      const hook = String(req.input.hook ?? '').trim()
      const audience = String(req.input.audience ?? '').trim()
      const format = String(req.input.format ?? 'reel').trim()
      return [
        {
          role: 'system',
          content:
            'You are an elite short-form hook editor. Output must match the provided JSON schema. No extra text.',
        },
        {
          role: 'user',
          content: `Analyze and improve this hook.\n\nFORMAT:\n${format}\n\nAUDIENCE:\n${audience || '(unspecified)'}\n\nHOOK:\n${hook || '(missing hook)'}\n\nReturn: hookScore, hookType, strongerHooks, notes.`,
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
      const cta = String(req.input.cta ?? '').trim()
      const offerType = String(req.input.offerType ?? '').trim()
      return [
        { role: 'system', content: 'You are a conversion strategist. Output JSON matching schema only.' },
        {
          role: 'user',
          content: `Score CTA-to-content match.\n\nCONTENT SUMMARY:\n${summary || '(missing)'}\n\nOFFER TYPE:\n${offerType || '(missing)'}\n\nCTA:\n${cta || '(missing)'}\n\nReturn: matchScore, mismatchReasons, improvedCtas.`,
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
    'Return ONLY valid JSON. No markdown or extra text.',
    'JSON shape requirements:',
    '{',
    '  "summary": { "headline": string, "keyInsight": string, "confidence": "low"|"medium"|"high" },',
    '  "recommendations": string[5-10],',
    '  "nextSteps": { "plan": string[3-7], "timeframe": string },',
    '  "stopDoing": string[3-7],',
    '  "toolOutput": { ... }',
    '}',
    toolFields.length
      ? `toolOutput must include fields: ${toolFields.join(', ')}`
      : 'toolOutput can include any relevant structured fields for this tool.',
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
    return {
      output: {
        summary: {
          headline: 'Analysis unavailable',
          keyInsight: 'AI request failed.',
          confidence: 'low',
        },
        recommendations: [],
        nextSteps: { plan: ['Retry with complete inputs.'], timeframe: '7 days' },
        stopDoing: [],
        toolOutput: { error: result.error.message },
      },
    }
  }

  return { output: result }
}

const analyticsSignalReaderRunner = async (req: RunRequest) => {
  const rawMetrics = String(req.input.last30 ?? '').trim()
  const priority = String(req.input.priority ?? 'watch_time').trim()

  const system = [
    'You are an Instagram analytics expert.',
    'Return ONLY valid JSON using the schema below.',
    'If data is insufficient, set summary.confidence="low", explain missing data in summary.missingData,',
    'and provide best-effort generic recommendations without guessing numbers.',
    'No markdown, no extra text.',
    '',
    'Output schema:',
    '{',
    '  "summary": {',
    '    "headline": string,',
    '    "primaryIssue": string,',
    '    "confidence": "low" | "medium" | "high",',
    '    "missingData": string[]',
    '  },',
    '  "signals": [{',
    '    "name": string,',
    '    "evidence": string,',
    '    "impact": "low" | "medium" | "high",',
    '    "severity": "low" | "medium" | "high"',
    '  }],',
    '  "prioritizedFixes": [{',
    '    "action": string,',
    '    "reason": string,',
    '    "expectedImpact": "low" | "medium" | "high",',
    '    "effort": "low" | "medium" | "high",',
    '    "timeframe": string',
    '  }],',
    '  "next7Days": [{',
    '    "day": string,',
    '    "focus": string,',
    '    "tasks": string[]',
    '  }],',
    '  "stopDoing": [{',
    '    "action": string,',
    '    "why": string',
    '  }],',
    '  "experiment": {',
    '    "hypothesis": string,',
    '    "test": string,',
    '    "successMetric": string,',
    '    "duration": string,',
    '    "risk": string,',
    '    "fallback": string',
    '  },',
    '  "notes": string[]',
    '}',
    '',
    'Requirements:',
    '- prioritizedFixes must be 5-10 items.',
    '- stopDoing must be 3-7 items.',
    '- next7Days must include 7 items (Day 1..Day 7).',
    '- Keep summary concise.',
  ].join('\n')

  const user = [
    `Priority: ${priority || 'watch_time'}`,
    'Metrics (last 30 days, messy paste allowed):',
    rawMetrics || '(missing)',
    '',
    'Task: Analyze signals, diagnose issues, and produce actionable fixes.',
    'If missing metrics, explain what is missing and proceed with best-effort guidance.',
  ].join('\n')

  const result = await runAIJson({
    system,
    user,
    temperature: 0.2,
    model: pickModel('heavy'),
  })

  if ('error' in result) {
    return {
      output: {
        summary: {
          headline: 'Analysis unavailable',
          primaryIssue: 'AI request failed',
          confidence: 'low',
          missingData: ['metrics'],
        },
        signals: [],
        prioritizedFixes: [],
        next7Days: [
          { day: 'Day 1', focus: 'Retry analysis', tasks: ['Paste metrics again and retry.'] },
          { day: 'Day 2', focus: 'Collect data', tasks: ['Export last 30 days insights.'] },
          { day: 'Day 3', focus: 'Baseline', tasks: ['List top posts and key metrics.'] },
          { day: 'Day 4', focus: 'Hooks', tasks: ['Review opening 3 seconds of top posts.'] },
          { day: 'Day 5', focus: 'CTAs', tasks: ['Audit CTAs and outcomes.'] },
          { day: 'Day 6', focus: 'Format', tasks: ['Compare formats and retention.'] },
          { day: 'Day 7', focus: 'Plan', tasks: ['Create a 7-day test plan.'] },
        ],
        stopDoing: [],
        experiment: {
          hypothesis: 'Improving hooks and CTAs will lift retention and saves.',
          test: 'Test two hook variants across similar posts.',
          successMetric: 'Retention + saves increase',
          duration: '7 days',
          risk: 'Low signal due to small sample size',
          fallback: 'Use qualitative feedback from comments/DMs.',
        },
        notes: [
          'AI request failed.',
          result.error.message,
        ],
      },
    }
  }

  return { output: result }
}

export const runnerRegistry: Record<string, (req: RunRequest, ctx: RunContext) => Promise<{ output: any }>> =
  Object.fromEntries(
    EXPECTED_TOOL_IDS.map((toolId) => [
      toolId,
      async (req: RunRequest, ctx: RunContext) =>
        toolId === 'analytics-signal-reader'
          ? analyticsSignalReaderRunner(req)
          : runToolWithAIJson(req, ctx),
    ])
  )
