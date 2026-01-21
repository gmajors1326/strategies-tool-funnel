import type { RunRequest } from '@/src/lib/tools/runTypes'
import type { ToolMeta } from '@/src/lib/tools/toolMeta'
import { TOOL_REGISTRY } from '@/src/lib/tools/registry'

export type RunContext = {
  user: { id: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
  toolMeta: ToolMeta
  usage: { aiTokensRemaining: number }
  logger: { info: (msg: string, meta?: any) => void; error: (msg: string, meta?: any) => void }
}

type Runner = (req: RunRequest, ctx: RunContext) => Promise<{ output: any }>

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

const safeStr = (v: any) => (typeof v === 'string' ? v : v == null ? '' : String(v))
const safeNum = (v: any) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const makeScoreFromText = (text: string) => clamp(Math.floor(text.trim().length * 1.6), 30, 95)

const deterministicFallback: Runner = async (req) => {
  const input = req.input ?? {}
  const text = safeStr(input.text || input.note || input.topic || input.hook || input.caption || '')
  const score = makeScoreFromText(text)

  return {
    output: {
      summary: 'Deterministic analysis (fallback)',
      score,
      inputsSeen: Object.keys(input),
      quickFixes: ['Shorten the first line.', 'Make the promise explicit.', 'Remove extra qualifiers.'],
    },
  }
}

const lightAiFallback: Runner = async (req) => {
  const input = req.input ?? {}
  const topic = safeStr(input.topic || input.hook || input.subject || input.offer || input.text || 'your topic')

  return {
    output: {
      summary: 'Light AI (mock) output — replace with real model call later.',
      variations: [
        `Stop scrolling: ${topic}.`,
        `Nobody tells you this about ${topic}.`,
        `The fastest fix for ${topic}.`,
        `You’re doing ${topic} wrong — here’s why.`,
        `If you want results, do THIS with ${topic}.`,
      ],
      nextStep: 'Pick one variation and tighten to 6–10 words.',
    },
  }
}

const heavyAiFallback: Runner = async (req) => {
  const input = req.input ?? {}
  const context = safeStr(input.context || input.caption || input.postText || input.topic || input.offer || '')

  return {
    output: {
      summary: 'Heavy AI (mock) output — replace with real model call later.',
      analysis: [
        'Main friction: unclear promise.',
        'Secondary friction: weak specificity.',
        'Conversion leak: CTA doesn’t match offer.',
      ],
      rewrite: context ? `${context.slice(0, 160)}… (tightened + clarified)` : 'Provide context to get a rewrite.',
      actionPlan: ['Rewrite hook', 'Add one proof point', 'Single CTA', 'Loop ending back to opening frame'],
    },
  }
}

/**
 * Custom runners for key tools (stable outputs your UI can count on).
 */
const customRunners: Record<string, Runner> = {
  // DM / conversation
  'dm-opener': async (req) => {
    const niche = safeStr(req.input?.niche)
    const offer = safeStr(req.input?.offer)
    const leadContext = safeStr(req.input?.leadContext || req.input?.lead || req.input?.context)
    const tone = safeStr(req.input?.tone || 'direct')
    const goal = safeStr(req.input?.goal || 'get_reply')

    const seed = `${niche} | ${offer} | ${leadContext}`.trim()
    const score = makeScoreFromText(seed)

    return {
      output: {
        goal,
        tone,
        openerOptions: [
          `Quick one — saw your work in ${niche}. Are you open to a fast idea to help with ${offer}?`,
          `Real question: what’s the biggest thing blocking results in ${niche} right now?`,
          `Not pitching — but if I could show a simple way to improve ${offer}, would you want it?`,
        ],
        followups: [
          `Totally get it. If I send one quick idea, would you prefer it here or a short Loom?`,
          `If you’re not the right person, who handles this for you?`,
        ],
        confidenceScore: score,
      },
    }
  },

  'dm-reply-builder': async (req) => {
    const lastMessage = safeStr(req.input?.lastMessage || req.input?.message || req.input?.text)
    const desiredOutcome = safeStr(req.input?.outcome || 'continue_convo')

    return {
      output: {
        desiredOutcome,
        replies: [
          `Totally fair — quick question so I don’t waste your time: what would make this a “yes” for you?`,
          `Got it. If I can show you a simple example, are you open to a 30-second version?`,
          `No worries. What are you focusing on this month instead?`,
        ],
        shorter: `Fair — what would make it worth it?`,
        basedOn: lastMessage ? lastMessage.slice(0, 140) : '(no message provided)',
      },
    }
  },

  'dm-objection-crusher': async (req) => {
    const objection = safeStr(req.input?.objection || req.input?.message || req.input?.text)
    return {
      output: {
        objection,
        angles: [
          { angle: 'Reframe', reply: `Makes sense. The goal isn’t “more content,” it’s fewer posts that convert.` },
          { angle: 'Proof', reply: `Totally. Here’s what typically changes when people fix the hook + CTA alignment.` },
          { angle: 'Risk reversal', reply: `If it doesn’t help, you don’t keep it. Simple.` },
        ],
        quickReply: `Fair. What’s the one thing you’d need to see to feel confident?`,
      },
    }
  },

  'dm-intelligence': async (req) => {
    const lead = safeStr(req.input?.lead || req.input?.leadContext || req.input?.profileSummary || '')
    const offer = safeStr(req.input?.offer || '')
    const score = clamp(makeScoreFromText(lead + offer), 20, 95)

    return {
      output: {
        leadScore: score,
        leadTier: score >= 80 ? 'Hot' : score >= 60 ? 'Warm' : 'Cold',
        riskFlags: score < 60 ? ['Low clarity on need', 'No urgency signal'] : [],
        bestAngle: score >= 70 ? 'Direct CTA to next step' : 'Value-first micro win',
        recommendedSequence: [
          'Opener that asks one qualifying question',
          'Micro win (1 tip / 1 insight)',
          'Permission-based CTA',
          'Time-bound close',
        ],
      },
    }
  },

  // Hooks / reels performance
  'hook-repurposer': async (req) => {
    const topic = safeStr(req.input?.topic || req.input?.hook || req.input?.text || 'your topic')
    const score = makeScoreFromText(topic)

    return {
      output: {
        hookScore: score,
        hookTypes: ['Curiosity', 'Direct', 'Contrarian', 'Proof-first', 'Fear-of-missing-out'],
        hooks: [
          `Stop doing this with ${topic}.`,
          `Nobody tells you this about ${topic}.`,
          `The fastest fix for ${topic}.`,
          `If ${topic} isn’t working, it’s because of THIS.`,
          `The simple rule that makes ${topic} convert.`,
          `You’re losing reach because of how you start ${topic}.`,
          `Do this before you post about ${topic}.`,
          `Here’s the uncomfortable truth about ${topic}.`,
        ],
        notes: ['Aim for 6–10 words', 'Make the promise concrete', 'End on the opening frame for a loop'],
      },
    }
  },

  'hook-library-builder': async (req) => {
    const niche = safeStr(req.input?.niche || req.input?.audience || 'your niche')
    return {
      output: {
        niche,
        buckets: {
          contrarian: [
            `Most ${niche} advice is backwards.`,
            `Stop copying what big accounts do.`,
            `The “best practice” that kills reach.`,
          ],
          nobodyTellsYou: [
            `Nobody tells you this about saves.`,
            `Nobody tells you the real job of a hook.`,
            `Nobody tells you to design for rewatches.`,
          ],
          proofFirst: [
            `I changed one thing and got 2x saves.`,
            `This is why your Reels stall at 1.2k views.`,
            `Before/after: what actually moved the needle.`,
          ],
        },
      },
    }
  },

  'retention-leak-finder': async (req) => {
    const len = safeNum(req.input?.videoLengthSeconds) ?? safeNum(req.input?.length) ?? 30
    const hookText = safeStr(req.input?.hookText || req.input?.hook || '')
    const avg = safeNum(req.input?.avgViewDurationSeconds)

    const risk = clamp(Math.floor((len - (avg ?? len * 0.45)) * 1.2), 0, 100)

    return {
      output: {
        videoLengthSeconds: len,
        avgViewDurationSeconds: avg ?? null,
        retentionRiskScore: risk,
        likelyLeaks: [
          hookText.length < 12 ? 'Hook too vague / too long' : 'Hook okay, but payoff timing may be late',
          'No pattern interrupt in first 2 seconds',
          'Ending doesn’t loop back to start',
        ],
        fixes: [
          'Make first frame pattern-breaking (text-only or hard cut)',
          'One idea only; cut supporting points',
          'Add micro-tension (“here’s the twist…”) at 2–3 seconds',
          'Loop the last frame back to the first',
        ],
      },
    }
  },

  'reel-script-6sec': async (req) => {
    const topic = safeStr(req.input?.topic || req.input?.text || 'your topic')
    return {
      output: {
        format: '6-second reel',
        script: [
          { t: '0.0–1.2s', line: `Stop. ${topic}.` },
          { t: '1.2–4.8s', line: `Do this instead: one clear promise + one proof line.` },
          { t: '4.8–6.0s', line: `Save this. (Loop to opening frame)` },
        ],
        onScreenText: [`Stop: ${topic}`, 'One promise. One proof.', 'Save this.'],
      },
    }
  },

  'reel-do-not-post': async (req) => {
    const hook = safeStr(req.input?.hook || req.input?.hookText || '')
    const verdict = hook.length < 10 ? 'Do not post' : 'Postable'
    return {
      output: {
        verdict,
        reasons:
          verdict === 'Do not post'
            ? ['Hook is too vague/short', 'No clear promise', 'Low curiosity tension']
            : ['Hook has a concrete claim', 'Viewer knows what they get'],
        fix: verdict === 'Do not post' ? 'Rewrite hook as: “Stop doing X. Do Y to get Z.”' : 'Tighten to fewer words.',
      },
    }
  },

  // Account diagnostics / positioning
  'engagement-diagnostic': async (req) => {
    const caption = safeStr(req.input?.caption || req.input?.postText || req.input?.text || '')
    const score = makeScoreFromText(caption)

    return {
      output: {
        engagementScore: score,
        biggestIssues: score < 70 ? ['Weak hook', 'Unclear CTA', 'Too much setup'] : ['Minor tightening'],
        savePotential: score > 80 ? 'High' : 'Medium',
        rewrite: caption ? `${caption.slice(0, 140)}… (cleaned + stronger CTA)` : 'Provide a caption/post text for rewrite.',
        commentBait: [
          'Which one are you guilty of?',
          'Want the checklist? Comment “LIST”.',
          'Do you agree or nah?',
        ],
      },
    }
  },

  'profile-clarity-audit': async (req) => {
    const bio = safeStr(req.input?.bio || req.input?.text || '')
    return {
      output: {
        currentBio: bio,
        problems: ['Who it’s for is unclear', 'No outcome/promise', 'No CTA'],
        upgradedBioOptions: [
          'I help [audience] get [result] with [method]. DM “START” for the playbook.',
          'Daily [niche] systems. Fewer posts, more buyers. Grab the free template ↓',
        ],
      },
    }
  },

  'niche-magnet': async (req) => {
    const audience = safeStr(req.input?.audience || req.input?.niche || 'your audience')
    const outcome = safeStr(req.input?.outcome || 'a clear result')
    return {
      output: {
        positioning: `This account is for ${audience} who want ${outcome}.`,
        contentAngles: ['Mistakes to avoid', 'Proof-first breakdowns', 'Simple systems', 'Hot takes'],
        bioOneLiner: `Helping ${audience} get ${outcome} — without posting more.`,
      },
    }
  },

  'bio-optimizer': async (req) => {
    const niche = safeStr(req.input?.niche || req.input?.audience || '')
    const offer = safeStr(req.input?.offer || '')
    return {
      output: {
        bios: [
          `I help ${niche || '[audience]'} get ${offer || '[result]'} with short, high-retention Reels. DM “START”.`,
          `${niche || 'Creators'} → ${offer || 'more leads'} using calm, conversion-first content. Free template ↓`,
        ],
        profileChecklist: ['Clear niche', 'Outcome promise', 'Proof line', 'One CTA', 'Link destination matches CTA'],
      },
    }
  },

  // Offers / conversion sanity
  'cta-match-analyzer': async (req) => {
    const offer = safeStr(req.input?.offer || '')
    const cta = safeStr(req.input?.cta || '')
    const score = clamp(Math.floor((offer.length + cta.length) * 1.9), 30, 100)

    return {
      output: {
        matchScore: score,
        mismatchReasons: score < 60 ? ['CTA too generic', 'Offer not explicit', 'No clear next step'] : [],
        improvedCtas: [
          'DM “PLAN” and I’ll send the template.',
          'Comment “CHECKLIST” and I’ll drop it.',
          'Grab the 2-minute walkthrough — link in bio.',
        ],
      },
    }
  },

  'offer-one-liner': async (req) => {
    const who = safeStr(req.input?.audience || req.input?.niche || '[audience]')
    const result = safeStr(req.input?.result || req.input?.outcome || '[result]')
    const method = safeStr(req.input?.method || '[method]')
    return {
      output: {
        oneLiners: [
          `I help ${who} get ${result} using ${method}.`,
          `${who}: get ${result} without doing more — using ${method}.`,
          `Get ${result} in ${who} with ${method}.`,
        ],
      },
    }
  },

  'landing-page-teardown': async (req) => {
    const url = safeStr(req.input?.url || '')
    const offer = safeStr(req.input?.offer || '')
    return {
      output: {
        url: url || '(not provided)',
        teardown: [
          'Above-the-fold promise needs a concrete outcome and timeframe.',
          'Add proof: 1 screenshot/testimonial or metric.',
          'Single CTA repeated 3x (top/mid/bottom).',
          'Remove extra navigation.',
        ],
        suggestedHero: offer ? `Get ${offer} without posting more.` : 'Make the promise concrete: result + timeframe + who it’s for.',
      },
    }
  },

  // Content planning / consistency
  '30-day-reels-plan': async (req) => {
    const niche = safeStr(req.input?.niche || req.input?.audience || 'your niche')
    return {
      output: {
        niche,
        schedule: Array.from({ length: 30 }).map((_, i) => ({
          day: i + 1,
          idea: i % 3 === 0 ? 'Contrarian take' : i % 3 === 1 ? 'Nobody tells you this' : 'Before/after shift',
          hook: i % 3 === 0 ? 'Stop doing this.' : i % 3 === 1 ? 'Nobody tells you…' : 'I used to think… now I do…',
        })),
      },
    }
  },

  'content-pillar-generator': async (req) => {
    const niche = safeStr(req.input?.niche || req.input?.audience || 'your niche')
    return {
      output: {
        niche,
        pillars: [
          { name: 'Mistakes', examples: ['3 reasons your content stalls', 'The hook error you repeat'] },
          { name: 'Systems', examples: ['My 6-second script', 'One-idea Reels framework'] },
          { name: 'Proof', examples: ['Before/after rewrite', 'Audit breakdown'] },
          { name: 'Hot takes', examples: ['Why consistency beats virality', 'Why likes don’t matter'] },
        ],
      },
    }
  },

  'carousel-outline-builder': async (req) => {
    const topic = safeStr(req.input?.topic || req.input?.text || 'your topic')
    return {
      output: {
        topic,
        slides: [
          { slide: 1, title: `Stop doing this with ${topic}`, body: 'Pattern-break + promise.' },
          { slide: 2, title: 'Why it fails', body: 'One clear reason.' },
          { slide: 3, title: 'The fix', body: 'One clear step.' },
          { slide: 4, title: 'Example', body: 'Show the rewrite / before-after.' },
          { slide: 5, title: 'CTA', body: 'Save this + DM keyword.' },
        ],
      },
    }
  },

  'comment-reply-generator': async (req) => {
    const comment = safeStr(req.input?.comment || req.input?.text || '')
    return {
      output: {
        comment,
        replies: [
          'Yep — and here’s the part people miss…',
          'Facts. Want the template? DM “PLAN”.',
          'This is exactly why I made that post.',
          'Curious: what niche are you in?',
        ],
      },
    }
  },

  // Competitive intelligence
  'competitor-reverse-engineer': async (req) => {
    const competitor = safeStr(req.input?.competitor || req.input?.handle || req.input?.url || '')
    return {
      output: {
        competitor: competitor || '(not provided)',
        whatTheyDoWell: ['Simple hooks', 'Clear niche framing', 'Repeating formats'],
        gapsToExploit: ['Weak CTA alignment', 'No “why now” urgency', 'Not enough proof'],
        stealThisFormat: ['3 slides: claim → proof → CTA', 'Reel: hook → 1 idea → loop'],
      },
    }
  },

  // Captions
  'caption-polisher': async (req) => {
    const caption = safeStr(req.input?.caption || req.input?.text || '')
    return {
      output: {
        original: caption,
        polished: caption ? `${caption.trim().slice(0, 200)}… (tightened, more punchy)` : 'Provide a caption to polish.',
        shortCaptionOptions: ['Save this.', 'DM “PLAN”.', 'Which one is you?', 'Don’t post until you do this.'],
      },
    }
  },
}

/**
 * Build final registry:
 * - For every tool in TOOL_REGISTRY, ensure there is a runner.
 * - Prefer custom runner; otherwise use fallback based on tool.type.
 * - Add legacy aliases for older IDs that may still exist in UI/tests.
 */
const built: Record<string, Runner> = {}

// 1) Populate all current tools (registry-driven)
for (const tool of TOOL_REGISTRY) {
  if (customRunners[tool.id]) {
    built[tool.id] = customRunners[tool.id]
    continue
  }

  if (tool.type === 'deterministic') built[tool.id] = deterministicFallback
  else if (tool.type === 'light_ai') built[tool.id] = lightAiFallback
  else built[tool.id] = heavyAiFallback
}

// 2) Legacy aliases (so old references don’t explode)
if (!built['hook-analyzer'] && built['hook-repurposer']) built['hook-analyzer'] = built['hook-repurposer']
if (!built['ig-post-intelligence'] && built['engagement-diagnostic'])
  built['ig-post-intelligence'] = built['engagement-diagnostic']
if (!built['yt-video-intelligence'] && built['retention-leak-finder'])
  built['yt-video-intelligence'] = built['retention-leak-finder']

export const runnerRegistry: Record<string, Runner> = built
