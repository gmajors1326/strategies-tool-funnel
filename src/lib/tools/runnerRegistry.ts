import type { RunRequest } from '@/src/lib/tools/runTypes'
import type { ToolMeta } from '@/src/lib/tools/toolMeta'

export type RunContext = {
  user: { id: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
  toolMeta: ToolMeta
  usage: { aiTokensRemaining: number }
  logger: { info: (msg: string, meta?: any) => void; error: (msg: string, meta?: any) => void }
}

export const runnerRegistry: Record<
  string,
  (req: RunRequest, ctx: RunContext) => Promise<{ output: any }>
> = {
  'hook-analyzer': async (req) => {
    const hook = req.input.hook || req.input.topic || 'Untitled hook'
    const score = Math.min(100, Math.max(40, hook.length * 2))
    return {
      output: {
        hookScore: score,
        hookType: score > 75 ? 'Curiosity' : 'Direct',
        strongerHooks: [
          `What if ${hook}?`,
          `${hook} — here is the twist.`,
          `The truth about ${hook}.`,
        ],
        notes: ['Tighten the opening line.', 'Add a clearer promise.'],
      },
    }
  },
  'cta-match-analyzer': async (req) => {
    const offer = req.input.offer || ''
    const cta = req.input.cta || ''
    const score = Math.min(100, Math.max(30, (offer.length + cta.length) * 2))
    return {
      output: {
        matchScore: score,
        mismatchReasons: score < 60 ? ['CTA too generic', 'Offer not explicit'] : [],
        improvedCtas: [
          'Reply “START” to get the checklist.',
          'DM “PLAN” for the template.',
          'Grab the full walkthrough link.',
        ],
      },
    }
  },
  'ig-post-intelligence': async (req) => {
    const caption = req.input.caption || req.input.postText || ''
    return {
      output: {
        hookQuality: caption.length > 80 ? 'Strong' : 'Needs clarity',
        clarity: caption.length > 60 ? 'Clear' : 'Unclear',
        savePotential: caption.length > 90 ? 'High' : 'Medium',
        rewriteCaption: `${caption.slice(0, 120)}... (refined)`,
        hookOptions: [
          'Stop doing this before you post.',
          'The mistake killing your reach.',
          'Do this before you hit publish.',
        ],
      },
    }
  },
  'yt-video-intelligence': async (req) => {
    const title = req.input.title || 'Untitled video'
    return {
      output: {
        retentionRisks: ['Opening lacks tension', 'CTA appears too early'],
        hookRewrite: `Why ${title} fails (and how to fix it fast)`,
        titleOptions: [
          `The real reason ${title} stalls`,
          `${title}: the fix no one tells you`,
          `How to make ${title} binge-worthy`,
        ],
        pacingNotes: ['Shorten intro by 20%', 'Add pattern interrupt at 45s'],
      },
    }
  },
}
