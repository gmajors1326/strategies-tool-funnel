export type HookGoal =
  | 'Stop the scroll'
  | 'Spark curiosity'
  | 'Authority/credibility'
  | 'Drive comments'
  | 'Drive profile clicks'

export type HookTone = 'Calm' | 'Direct' | 'Curious' | 'Bold'

export type HookPlatform = 'Reels' | 'TikTok' | 'Shorts'

export interface HookRepurposerInputs {
  hookInput: string
  videoContext?: string
  goal?: HookGoal
  tone?: HookTone
  platformFocus?: HookPlatform
}

export interface HookVariation {
  angle: (typeof ANGLES)[number] | (typeof EXTRA_ANGLES)[number]
  text: string
}

export interface HookRepurposerOutputs {
  hooks: HookVariation[]
  explanation: string
  visualSuggestions: {
    bRoll: string[]
    alternatives: string[]
  }
}

const ANGLES = [
  'Curiosity gap',
  'Reframe/contrarian',
  'Problem-first',
  'Outcome-first',
  'Observation-based',
  'Pattern interrupt',
] as const

const EXTRA_ANGLES = ['Comment prompt'] as const

function trimHook(hook: string): string {
  return hook.replace(/\s+/g, ' ').trim().replace(/^["']|["']$/g, '')
}

function extractCore(hook: string): string {
  const cleaned = trimHook(hook)
  if (!cleaned) return 'this'

  const firstSentence = cleaned.split(/[.!?]/)[0]
  const words = firstSentence.split(' ').filter(Boolean)
  const core = words.slice(0, 8).join(' ')
  return core.length > 5 ? core : cleaned
}

function applyTone(text: string, tone: HookTone): string {
  switch (tone) {
    case 'Calm':
      return text.replace(/!/g, '.')
    case 'Direct':
      return text.replace(/^Maybe\s+/i, '').replace(/\s+here's/i, ' here is')
    case 'Curious':
      return text.replace(/\.$/, '?')
    case 'Bold':
      return text.endsWith('!') ? text : `${text} `
    default:
      return text
  }
}

function buildHooks(core: string, tone: HookTone, goal?: HookGoal): HookVariation[] {
  const baseHooks: Record<(typeof ANGLES)[number], string> = {
    'Curiosity gap': `Most people miss this about ${core}. The detail changes everything.`,
    'Reframe/contrarian': `Stop framing ${core} this way. The real shift is one layer deeper.`,
    'Problem-first': `If ${core} feels stuck, this is the reason.`,
    'Outcome-first': `Want better results from ${core}? Start here first.`,
    'Observation-based': `I noticed ${core} gets ignored for a simple reason.`,
    'Pattern interrupt': `Quick reset: ${core} is backwards.`,
  }

  const hooks: HookVariation[] = ANGLES.map((angle) => ({
    angle,
    text: applyTone(baseHooks[angle], tone),
  }))

  if (goal === 'Drive comments') {
    hooks.push({
      angle: 'Comment prompt',
      text: applyTone(`What part of ${core} feels most unclear right now?`, tone),
    })
  }

  return hooks.slice(0, 8)
}

function chooseBestAngle(goal?: HookGoal): string {
  switch (goal) {
    case 'Stop the scroll':
      return 'Pattern interrupt'
    case 'Spark curiosity':
      return 'Curiosity gap'
    case 'Authority/credibility':
      return 'Observation-based'
    case 'Drive comments':
      return 'Problem-first'
    case 'Drive profile clicks':
      return 'Outcome-first'
    default:
      return 'Reframe/contrarian'
  }
}

function buildExplanation(bestAngle: string): string {
  return `This angle works because it reframes the original idea without copying it. By leading with a ${bestAngle.toLowerCase()} angle, the hook creates a clear reason to pause while keeping the tone measured and intentional.`
}

function buildVisualSuggestions(videoContext?: string): HookRepurposerOutputs['visualSuggestions'] {
  const context = videoContext?.toLowerCase() || ''
  const bRoll: string[] = []

  if (context.includes('talking head')) {
    bRoll.push('Tight crop on your face with a slow push-in', 'Hand gesture near on-screen text')
  }
  if (context.includes('screen') || context.includes('recording')) {
    bRoll.push('Cutaway to a quick screen recording', 'Over-the-shoulder typing shot')
  }
  if (context.includes('b-roll') || context.includes('workspace')) {
    bRoll.push('Slow pan of your workspace', 'Close-up of tools or notes on desk')
  }
  if (context.includes('pointing')) {
    bRoll.push('Point to a single line of text on screen')
  }

  if (bRoll.length < 3) {
    bRoll.push(
      'Reaction shot before text appears',
      'Text-only hook with delayed reveal',
      'Cutaway to hands writing a short note'
    )
  }

  const alternatives = [
    'Use someone else’s post as green-screen context (describe type, not a specific account)',
    'Text-only hook with a slow fade-in, then reveal the key line',
  ]

  return {
    bRoll: bRoll.slice(0, 5),
    alternatives: alternatives.slice(0, 2),
  }
}

export function runHookRepurposer(inputs: HookRepurposerInputs): HookRepurposerOutputs {
  const core = extractCore(inputs.hookInput)
  const tone = inputs.tone || 'Calm'
  const hooks = buildHooks(core, tone, inputs.goal)
  const bestAngle = chooseBestAngle(inputs.goal)

  return {
    hooks,
    explanation: buildExplanation(bestAngle),
    visualSuggestions: buildVisualSuggestions(inputs.videoContext),
  }
}
