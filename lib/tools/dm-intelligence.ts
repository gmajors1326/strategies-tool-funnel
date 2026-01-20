export interface DMIntelligenceInputs {
  scenario: 'commenter' | 'story_reply' | 'inbound_dm' | 'warm_lead' | 'coldish_lead'
  intent: 'continue_convo' | 'qualify' | 'soft_invite' | 'book_call'
  tone: 'calm' | 'friendly' | 'playful' | 'professional' | 'direct'
  conversationSnippet: string
  offerType?: 'service' | 'course' | 'digital_product' | 'none'
  boundary?: 'no_pitch' | 'soft_pitch_ok' | 'direct_pitch_ok'
  style?: 'strategist' | 'closer'
}

export interface DMIntelligenceOutputs {
  recommendedReply: string
  alternateReply: string
  nextStep: string
  riskNote: string | null
  reasoning: string
  detectedWarmth: 'cold' | 'warm' | 'hot'
  pitchReadiness: 'not_ready' | 'maybe' | 'ready'
}

/**
 * Deterministic logic for DM Intelligence Engine
 * Calculates warmth and pitch readiness before AI enhancement
 */
export function runDMIntelligence(inputs: DMIntelligenceInputs): Partial<DMIntelligenceOutputs> {
  const { scenario, intent, conversationSnippet, offerType, boundary } = inputs

  // Detect warmth based on scenario and conversation context
  const detectedWarmth = detectWarmth(scenario, conversationSnippet)

  // Determine pitch readiness
  const pitchReadiness = determinePitchReadiness(
    detectedWarmth,
    intent,
    boundary || 'no_pitch',
    conversationSnippet
  )

  // Generate risk note if pitch is premature
  const riskNote = generateRiskNote(pitchReadiness, boundary || 'no_pitch', offerType)

  return {
    detectedWarmth,
    pitchReadiness,
    riskNote,
  }
}

function detectWarmth(
  scenario: DMIntelligenceInputs['scenario'],
  conversationSnippet: string
): 'cold' | 'warm' | 'hot' {
  const snippet = conversationSnippet.toLowerCase()

  // Hot indicators
  const hotIndicators = [
    'interested',
    'tell me more',
    'how much',
    'when can we',
    'yes',
    'sounds good',
    'i\'d love to',
    'definitely',
    'absolutely',
  ]

  // Warm indicators
  const warmIndicators = [
    'maybe',
    'possibly',
    'could be',
    'might',
    'interesting',
    'thanks',
    'appreciate',
    'helpful',
  ]

  // Scenario-based warmth
  const scenarioWarmth: Record<DMIntelligenceInputs['scenario'], 'cold' | 'warm' | 'hot'> = {
    warm_lead: 'hot',
    inbound_dm: 'warm',
    story_reply: 'warm',
    commenter: 'cold',
    coldish_lead: 'cold',
  }

  // Check conversation snippet for indicators
  const hasHotIndicator = hotIndicators.some((indicator) => snippet.includes(indicator))
  const hasWarmIndicator = warmIndicators.some((indicator) => snippet.includes(indicator))

  if (hasHotIndicator) {
    return 'hot'
  }

  if (hasWarmIndicator || scenarioWarmth[scenario] === 'warm') {
    return 'warm'
  }

  if (scenarioWarmth[scenario] === 'hot') {
    return 'hot'
  }

  return scenarioWarmth[scenario] || 'cold'
}

function determinePitchReadiness(
  warmth: 'cold' | 'warm' | 'hot',
  intent: DMIntelligenceInputs['intent'],
  boundary: 'no_pitch' | 'soft_pitch_ok' | 'direct_pitch_ok',
  conversationSnippet: string
): 'not_ready' | 'maybe' | 'ready' {
  // If boundary says no pitch, never ready
  if (boundary === 'no_pitch') {
    return 'not_ready'
  }

  // Intent-based readiness
  const intentReadiness: Record<DMIntelligenceInputs['intent'], 'not_ready' | 'maybe' | 'ready'> = {
    book_call: 'ready',
    soft_invite: warmth === 'hot' ? 'ready' : 'maybe',
    qualify: warmth === 'hot' ? 'maybe' : 'not_ready',
    continue_convo: 'not_ready',
  }

  // Warmth-based adjustments
  if (warmth === 'hot' && intent === 'qualify') {
    return 'maybe'
  }

  if (warmth === 'cold' && intent === 'soft_invite') {
    return 'not_ready'
  }

  // Check conversation snippet for explicit interest
  const snippet = conversationSnippet.toLowerCase()
  if (snippet.includes('how much') || snippet.includes('tell me more') || snippet.includes('interested')) {
    if (boundary !== 'no_pitch') {
      return 'ready'
    }
  }

  return intentReadiness[intent] || 'not_ready'
}

function generateRiskNote(
  pitchReadiness: 'not_ready' | 'maybe' | 'ready',
  boundary: 'no_pitch' | 'soft_pitch_ok' | 'direct_pitch_ok',
  offerType?: 'service' | 'course' | 'digital_product' | 'none'
): string | null {
  if (pitchReadiness === 'ready' || boundary === 'no_pitch') {
    return null
  }

  if (pitchReadiness === 'not_ready' && boundary !== 'no_pitch') {
    const offerContext = offerType && offerType !== 'none' ? ` your ${offerType}` : ' your offer'
    return `Pitching too early risks losing trust. Focus on building rapport first. Once they show clear interest, then introduce${offerContext}.`
  }

  if (pitchReadiness === 'maybe') {
    return `Proceed with caution. Test the waters with a soft question before introducing your offer.`
  }

  return null
}
