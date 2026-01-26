type NormalizeResult = {
  output: any
  changed: boolean
}

const ensureString = (value: any, fallback = 'Needs more input.'): NormalizeResult => {
  if (typeof value === 'string') return { output: value, changed: false }
  return { output: fallback, changed: true }
}

const ensureNumber = (value: any, fallback = 0): NormalizeResult => {
  if (typeof value === 'number' && Number.isFinite(value)) return { output: value, changed: false }
  return { output: fallback, changed: true }
}

const ensureArray = (value: any): NormalizeResult => {
  if (Array.isArray(value)) return { output: value, changed: false }
  return { output: [], changed: true }
}

const ensureEnum = (value: any, allowed: string[], fallback: string): NormalizeResult => {
  if (typeof value === 'string' && allowed.includes(value)) return { output: value, changed: false }
  return { output: fallback, changed: true }
}

const ensureStringArray = (value: any, length?: number, fallback = 'Needs more input.'): NormalizeResult => {
  const arrResult = ensureArray(value)
  let changed = arrResult.changed
  const arr = (arrResult.output as any[]).map((item) => {
    const s = ensureString(item, fallback)
    if (s.changed) changed = true
    return s.output
  })
  if (typeof length === 'number') {
    if (arr.length !== length) changed = true
    if (arr.length < length) {
      while (arr.length < length) arr.push(fallback)
    } else if (arr.length > length) {
      arr.length = length
    }
  }
  if (arr.length === 0) {
    arr.push(fallback)
    changed = true
  }
  return { output: arr, changed }
}

const ensureObject = (value: any): NormalizeResult => {
  if (value && typeof value === 'object' && !Array.isArray(value)) return { output: value, changed: false }
  return { output: {}, changed: true }
}

function normalizeHookAnalyzer(data: any): NormalizeResult {
  let changed = false
  const scoreObj = ensureObject(data?.score)
  changed ||= scoreObj.changed
  const score = {
    hook: ensureNumber(scoreObj.output?.hook).output,
    clarity: ensureNumber(scoreObj.output?.clarity).output,
    curiosity: ensureNumber(scoreObj.output?.curiosity).output,
    specificity: ensureNumber(scoreObj.output?.specificity).output,
  }
  if (
    scoreObj.output?.hook === undefined ||
    scoreObj.output?.clarity === undefined ||
    scoreObj.output?.curiosity === undefined ||
    scoreObj.output?.specificity === undefined
  ) {
    changed = true
  }

  const hookType = ensureEnum(
    data?.hookType,
    [
      'contrarian',
      'nobody_tells_you',
      'before_after',
      'simple_truth',
      'story',
      'how_to',
      'list',
      'warning',
      'other',
    ],
    'other'
  )
  changed ||= hookType.changed

  const bestFor = ensureStringArray(data?.bestFor)
  changed ||= bestFor.changed

  const diagnosisObj = ensureObject(data?.diagnosis)
  changed ||= diagnosisObj.changed
  const diagnosis = {
    whatWorks: ensureStringArray(diagnosisObj.output?.whatWorks).output,
    whatHurts: ensureStringArray(diagnosisObj.output?.whatHurts).output,
    retentionRisk: ensureEnum(diagnosisObj.output?.retentionRisk, ['low', 'med', 'high'], 'low').output,
  }
  if (
    diagnosisObj.output?.whatWorks === undefined ||
    diagnosisObj.output?.whatHurts === undefined ||
    diagnosisObj.output?.retentionRisk === undefined
  ) {
    changed = true
  }

  const rewriteStyles = [
    'safer',
    'sharper',
    'more_specific',
    'contrarian',
    'curiosity_gap',
    'authority',
    'short_5_words',
    'question',
    'numbers',
    'callout',
  ]
  const rewritesRaw = Array.isArray(data?.rewrites) ? data.rewrites : []
  const rewrites = rewriteStyles.map((style, idx) => {
    const found = rewritesRaw.find((item: any) => item?.style === style) || rewritesRaw[idx] || {}
    const hook = ensureString(found?.hook)
    if (!found?.style || found?.style !== style || hook.changed) changed = true
    return { style, hook: hook.output }
  })
  if (rewritesRaw.length !== rewriteStyles.length) changed = true

  const planObj = ensureObject(data?.['6secReelPlan'])
  changed ||= planObj.changed
  const openingFrameText = ensureString(planObj.output?.openingFrameText)
  changed ||= openingFrameText.changed
  const loopEnding = ensureString(planObj.output?.loopEnding)
  changed ||= loopEnding.changed

  const beatTimes = ['0.0-1.5', '1.5-3.5', '3.5-5.5', '5.5-6.0']
  const beatsRaw = Array.isArray(planObj.output?.beats) ? planObj.output.beats : []
  const beats = beatTimes.map((t, idx) => {
    const raw = beatsRaw[idx] || {}
    const onScreen = ensureString(raw?.onScreen)
    const voice = ensureString(raw?.voice)
    if (!raw?.t || raw?.t !== t || onScreen.changed || voice.changed) changed = true
    return { t, onScreen: onScreen.output, voice: voice.output }
  })

  const avoid = ensureStringArray(data?.avoid)
  changed ||= avoid.changed

  const ctaObj = ensureObject(data?.cta)
  changed ||= ctaObj.changed
  const cta = {
    recommended: ensureEnum(ctaObj.output?.recommended, ['save', 'follow', 'comment', 'dm'], 'save').output,
    line: ensureString(ctaObj.output?.line).output,
  }
  if (ctaObj.output?.recommended === undefined || ctaObj.output?.line === undefined) changed = true

  const notes = ensureStringArray(data?.notes)
  changed ||= notes.changed

  return {
    output: {
      score,
      hookType: hookType.output,
      bestFor: bestFor.output,
      diagnosis,
      rewrites,
      '6secReelPlan': {
        openingFrameText: openingFrameText.output,
        beats,
        loopEnding: loopEnding.output,
      },
      avoid: avoid.output,
      cta,
      notes: notes.output,
    },
    changed,
  }
}

function normalizeAnalyticsSignalReader(data: any): NormalizeResult {
  let changed = false
  const summaryObj = ensureObject(data?.summary)
  changed ||= summaryObj.changed
  const summary = {
    primaryIssue: ensureEnum(
      summaryObj.output?.primaryIssue,
      ['reach', 'retention', 'conversion', 'positioning', 'consistency', 'unknown'],
      'unknown'
    ).output,
    confidence: ensureNumber(summaryObj.output?.confidence).output,
    oneSentenceDiagnosis: ensureString(summaryObj.output?.oneSentenceDiagnosis).output,
  }
  if (
    summaryObj.output?.primaryIssue === undefined ||
    summaryObj.output?.confidence === undefined ||
    summaryObj.output?.oneSentenceDiagnosis === undefined
  ) {
    changed = true
  }

  const signalsRaw = Array.isArray(data?.signals) ? data.signals : []
  const signals = signalsRaw.map((item: any) => {
    const signal = ensureString(item?.signal)
    const evidence = ensureString(item?.evidence)
    const severity = ensureEnum(item?.severity, ['low', 'med', 'high'], 'low')
    if (signal.changed || evidence.changed || severity.changed) changed = true
    return { signal: signal.output, evidence: evidence.output, severity: severity.output }
  })
  if (!Array.isArray(data?.signals)) changed = true

  const fixesRaw = Array.isArray(data?.prioritizedFixes) ? data.prioritizedFixes : []
  const prioritizedFixes = fixesRaw.map((item: any) => {
    const title = ensureString(item?.title)
    const why = ensureString(item?.why)
    const how = ensureStringArray(item?.how)
    const impact = ensureEnum(item?.impact, ['low', 'med', 'high'], 'low')
    const effort = ensureEnum(item?.effort, ['low', 'med', 'high'], 'low')
    if (title.changed || why.changed || how.changed || impact.changed || effort.changed) changed = true
    return { title: title.output, why: why.output, how: how.output, impact: impact.output, effort: effort.output }
  })
  if (!Array.isArray(data?.prioritizedFixes)) changed = true

  const daysRaw = Array.isArray(data?.next7Days) ? data.next7Days : []
  const next7Days = Array.from({ length: 7 }).map((_, idx) => {
    const raw = daysRaw.find((d: any) => d?.day === idx + 1) || daysRaw[idx] || {}
    const reelIdea = ensureString(raw?.reelIdea)
    const hook = ensureString(raw?.hook)
    const shotPlan = ensureStringArray(raw?.shotPlan)
    const cta = ensureEnum(raw?.cta, ['save', 'follow', 'dm', 'comment'], 'save')
    if (raw?.day !== idx + 1 || reelIdea.changed || hook.changed || shotPlan.changed || cta.changed) changed = true
    return {
      day: idx + 1,
      reelIdea: reelIdea.output,
      hook: hook.output,
      shotPlan: shotPlan.output,
      cta: cta.output,
    }
  })

  const stopDoing = ensureStringArray(data?.stopDoing)
  changed ||= stopDoing.changed

  const experimentObj = ensureObject(data?.experiment)
  changed ||= experimentObj.changed
  const experiment = {
    name: ensureString(experimentObj.output?.name).output,
    hypothesis: ensureString(experimentObj.output?.hypothesis).output,
    steps: ensureStringArray(experimentObj.output?.steps).output,
    successMetric: ensureString(experimentObj.output?.successMetric).output,
  }
  if (
    experimentObj.output?.name === undefined ||
    experimentObj.output?.hypothesis === undefined ||
    experimentObj.output?.steps === undefined ||
    experimentObj.output?.successMetric === undefined
  ) {
    changed = true
  }

  const notes = ensureStringArray(data?.notes)
  changed ||= notes.changed

  return {
    output: {
      summary,
      signals,
      prioritizedFixes,
      next7Days,
      stopDoing: stopDoing.output,
      experiment,
      notes: notes.output,
    },
    changed,
  }
}

function normalizeDmIntelligenceEngine(data: any): NormalizeResult {
  let changed = false
  const contextObj = ensureObject(data?.context)
  changed ||= contextObj.changed
  const context = {
    leadType: ensureEnum(contextObj.output?.leadType, ['cold', 'warm', 'hot', 'unknown'], 'unknown').output,
    intent: ensureEnum(contextObj.output?.intent, ['info', 'price', 'proof', 'objection', 'ready', 'unknown'], 'unknown')
      .output,
  }
  if (contextObj.output?.leadType === undefined || contextObj.output?.intent === undefined) changed = true

  const bestReplyObj = ensureObject(data?.bestReply)
  changed ||= bestReplyObj.changed
  const bestReply = {
    message: ensureString(bestReplyObj.output?.message).output,
    tone: ensureEnum(bestReplyObj.output?.tone, ['calm', 'direct', 'friendly', 'professional'], 'calm').output,
    length: ensureEnum(bestReplyObj.output?.length, ['short', 'medium'], 'short').output,
  }
  if (
    bestReplyObj.output?.message === undefined ||
    bestReplyObj.output?.tone === undefined ||
    bestReplyObj.output?.length === undefined
  ) {
    changed = true
  }

  const alternativesRaw = Array.isArray(data?.alternatives) ? data.alternatives : []
  const altLabels = ['softer', 'firmer', 'qualify']
  const alternatives = altLabels.map((label, idx) => {
    const raw = alternativesRaw.find((a: any) => a?.label === label) || alternativesRaw[idx] || {}
    const message = ensureString(raw?.message)
    if (!raw?.label || raw?.label !== label || message.changed) changed = true
    return { label, message: message.output }
  })

  const nextQuestions = ensureStringArray(data?.nextQuestions, 3)
  changed ||= nextQuestions.changed
  const doNotSay = ensureStringArray(data?.doNotSay, 3)
  changed ||= doNotSay.changed

  const followRaw = Array.isArray(data?.followUpPlan) ? data.followUpPlan : []
  const followUpPlan = followRaw.map((item: any) => {
    const when = ensureEnum(item?.when, ['same_day', '24h', '48h'], 'same_day')
    const message = ensureString(item?.message)
    if (when.changed || message.changed) changed = true
    return { when: when.output, message: message.output }
  })
  if (!Array.isArray(data?.followUpPlan)) changed = true

  return {
    output: {
      context,
      bestReply,
      alternatives,
      nextQuestions: nextQuestions.output,
      doNotSay: doNotSay.output,
      followUpPlan,
    },
    changed,
  }
}

function normalizeOfferClarityCheck(data: any): NormalizeResult {
  let changed = false
  const scoreObj = ensureObject(data?.score)
  changed ||= scoreObj.changed
  const score = {
    clarity: ensureNumber(scoreObj.output?.clarity).output,
    specificity: ensureNumber(scoreObj.output?.specificity).output,
    believability: ensureNumber(scoreObj.output?.believability).output,
  }
  if (
    scoreObj.output?.clarity === undefined ||
    scoreObj.output?.specificity === undefined ||
    scoreObj.output?.believability === undefined
  ) {
    changed = true
  }

  const diagnosisObj = ensureObject(data?.diagnosis)
  changed ||= diagnosisObj.changed
  const diagnosis = {
    confusingParts: ensureStringArray(diagnosisObj.output?.confusingParts).output,
    missingInfo: ensureStringArray(diagnosisObj.output?.missingInfo).output,
    risk: ensureEnum(diagnosisObj.output?.risk, ['low', 'med', 'high'], 'low').output,
  }
  if (
    diagnosisObj.output?.confusingParts === undefined ||
    diagnosisObj.output?.missingInfo === undefined ||
    diagnosisObj.output?.risk === undefined
  ) {
    changed = true
  }

  const rewritesRaw = Array.isArray(data?.rewrites) ? data.rewrites : []
  const formats = ['one_liner', 'two_lines', 'bullet_offer']
  const rewrites = formats.map((format, idx) => {
    const raw = rewritesRaw.find((r: any) => r?.format === format) || rewritesRaw[idx] || {}
    const text = ensureString(raw?.text)
    if (!raw?.format || raw?.format !== format || text.changed) changed = true
    return { format, text: text.output }
  })

  const proofToAdd = ensureStringArray(data?.proofToAdd, 3)
  changed ||= proofToAdd.changed
  const pricingFrame = ensureStringArray(data?.pricingFrame, 2)
  changed ||= pricingFrame.changed
  const ctaOptions = ensureStringArray(data?.ctaOptions, 3)
  changed ||= ctaOptions.changed

  return {
    output: {
      score,
      diagnosis,
      rewrites,
      proofToAdd: proofToAdd.output,
      pricingFrame: pricingFrame.output,
      ctaOptions: ctaOptions.output,
    },
    changed,
  }
}

function normalizeReelScriptBuilder(data: any): NormalizeResult {
  let changed = false
  const hookOptions = ensureStringArray(data?.hookOptions, 3)
  changed ||= hookOptions.changed

  const scriptObj = ensureObject(data?.script)
  changed ||= scriptObj.changed
  const script = {
    onScreen: ensureStringArray(scriptObj.output?.onScreen, 4).output,
    voiceover: ensureStringArray(scriptObj.output?.voiceover, 4).output,
  }
  if (scriptObj.output?.onScreen === undefined || scriptObj.output?.voiceover === undefined) changed = true

  const shotPlan = ensureStringArray(data?.shotPlan, 4)
  changed ||= shotPlan.changed
  const loopEnding = ensureString(data?.loopEnding)
  changed ||= loopEnding.changed
  const caption = ensureString(data?.caption)
  changed ||= caption.changed
  const cta = ensureEnum(data?.cta, ['save', 'follow', 'comment', 'dm'], 'save')
  changed ||= cta.changed
  const hashtags = ensureStringArray(data?.hashtags, 10)
  changed ||= hashtags.changed

  return {
    output: {
      hookOptions: hookOptions.output,
      script,
      shotPlan: shotPlan.output,
      loopEnding: loopEnding.output,
      caption: caption.output,
      cta: cta.output,
      hashtags: hashtags.output,
    },
    changed,
  }
}

export function normalizeToolOutput(toolId: string, data: any): any {
  if (data?.error) return data

  let result: NormalizeResult
  switch (toolId) {
    case 'hook-analyzer':
      result = normalizeHookAnalyzer(data)
      break
    case 'analytics-signal-reader':
      result = normalizeAnalyticsSignalReader(data)
      break
    case 'dm-intelligence-engine':
      result = normalizeDmIntelligenceEngine(data)
      break
    case 'offer-clarity-check':
      result = normalizeOfferClarityCheck(data)
      break
    case 'reel-script-builder':
      result = normalizeReelScriptBuilder(data)
      break
    default:
      return data
  }

  if (result.changed) {
    console.warn(`[normalizeToolOutput] Missing keys normalized for ${toolId}`)
  }

  return result.output
}
