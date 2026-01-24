import { z } from 'zod'

export const HookAnalyzerOutputSchema = z.object({
  score: z.object({
    hook: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    curiosity: z.number().min(0).max(100),
    specificity: z.number().min(0).max(100),
  }),
  hookType: z.string(),
  bestFor: z.array(z.string()),
  diagnosis: z.object({
    whatWorks: z.array(z.string()),
    whatHurts: z.array(z.string()),
    retentionRisk: z.string(),
  }),
  rewrites: z.array(
    z.object({
      style: z.string(),
      hook: z.string(),
    })
  ),
  '6secReelPlan': z.object({
    openingFrameText: z.string(),
    beats: z.array(
      z.object({
        t: z.string(),
        onScreen: z.string(),
        voice: z.string(),
      })
    ),
    loopEnding: z.string(),
  }),
  cta: z.object({
    recommended: z.string(),
    line: z.string(),
  }),
  avoid: z.array(z.string()),
  evidence: z.array(z.string()),
})

export const CtaMatchOutputSchema = z.object({
  score: z.object({
    alignment: z.number().min(0).max(100),
    clarity: z.number().min(0).max(100),
    friction: z.number().min(0).max(100),
  }),
  diagnosis: z.object({
    matches: z.array(z.string()),
    mismatches: z.array(z.string()),
    whyItHurts: z.string(),
  }),
  rewrites: z.array(
    z.object({
      cta: z.string(),
      rationale: z.string(),
    })
  ),
  bestNextAction: z.string(),
  evidence: z.array(z.string()),
})

export const ContentAngleOutputSchema = z.object({
  angles: z.array(
    z.object({
      angle: z.string(),
      hook: z.string(),
      format: z.string(),
      rationale: z.string(),
    })
  ),
  notes: z.array(z.string()),
  evidence: z.array(z.string()),
})

export const CaptionOptimizerOutputSchema = z.object({
  optimizedCaption: z.string(),
  openingLine: z.string(),
  structure: z.array(z.string()),
  ctaLine: z.string(),
  doNotUse: z.array(z.string()),
  notes: z.array(z.string()),
  evidence: z.array(z.string()),
})

export const EngagementDiagnosticOutputSchema = z.object({
  summary: z.object({
    primaryIssue: z.enum(['hook', 'retention', 'positioning', 'cta', 'audience', 'unknown']),
    confidence: z.number().min(0).max(1),
    oneSentenceDiagnosis: z.string(),
  }),
  signals: z.array(
    z.object({
      signal: z.string(),
      evidence: z.string(),
      severity: z.enum(['low', 'med', 'high']),
    })
  ),
  prioritizedFixes: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      how: z.array(z.string()),
      impact: z.enum(['low', 'med', 'high']),
      effort: z.enum(['low', 'med', 'high']),
    })
  ),
  nextSteps: z.array(z.string()),
  stopDoing: z.array(z.string()),
  experiment: z.object({
    name: z.string(),
    hypothesis: z.string(),
    steps: z.array(z.string()),
    successMetric: z.string(),
  }),
  notes: z.array(z.string()),
  evidence: z.array(z.string()),
})

export const TOOL_OUTPUT_ZOD = {
  'hook-analyzer': HookAnalyzerOutputSchema,
  'cta-match-analyzer': CtaMatchOutputSchema,
  'content-angle-generator': ContentAngleOutputSchema,
  'caption-optimizer': CaptionOptimizerOutputSchema,
  'engagement-diagnostic': EngagementDiagnosticOutputSchema,
} as const

export const TOOL_OUTPUT_JSON_SCHEMA = {
  'hook-analyzer': {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: {
        type: 'object',
        additionalProperties: false,
        properties: {
          hook: { type: 'number', minimum: 0, maximum: 100 },
          clarity: { type: 'number', minimum: 0, maximum: 100 },
          curiosity: { type: 'number', minimum: 0, maximum: 100 },
          specificity: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['hook', 'clarity', 'curiosity', 'specificity'],
      },
      hookType: { type: 'string' },
      bestFor: { type: 'array', items: { type: 'string' } },
      diagnosis: {
        type: 'object',
        additionalProperties: false,
        properties: {
          whatWorks: { type: 'array', items: { type: 'string' } },
          whatHurts: { type: 'array', items: { type: 'string' } },
          retentionRisk: { type: 'string' },
        },
        required: ['whatWorks', 'whatHurts', 'retentionRisk'],
      },
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            style: { type: 'string' },
            hook: { type: 'string' },
          },
          required: ['style', 'hook'],
        },
      },
      '6secReelPlan': {
        type: 'object',
        additionalProperties: false,
        properties: {
          openingFrameText: { type: 'string' },
          beats: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                t: { type: 'string' },
                onScreen: { type: 'string' },
                voice: { type: 'string' },
              },
              required: ['t', 'onScreen', 'voice'],
            },
          },
          loopEnding: { type: 'string' },
        },
        required: ['openingFrameText', 'beats', 'loopEnding'],
      },
      cta: {
        type: 'object',
        additionalProperties: false,
        properties: {
          recommended: { type: 'string' },
          line: { type: 'string' },
        },
        required: ['recommended', 'line'],
      },
      avoid: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'string' } },
    },
    required: ['score', 'hookType', 'bestFor', 'diagnosis', 'rewrites', '6secReelPlan', 'cta', 'avoid', 'evidence'],
  },
  'cta-match-analyzer': {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: {
        type: 'object',
        additionalProperties: false,
        properties: {
          alignment: { type: 'number', minimum: 0, maximum: 100 },
          clarity: { type: 'number', minimum: 0, maximum: 100 },
          friction: { type: 'number', minimum: 0, maximum: 100 },
        },
        required: ['alignment', 'clarity', 'friction'],
      },
      diagnosis: {
        type: 'object',
        additionalProperties: false,
        properties: {
          matches: { type: 'array', items: { type: 'string' } },
          mismatches: { type: 'array', items: { type: 'string' } },
          whyItHurts: { type: 'string' },
        },
        required: ['matches', 'mismatches', 'whyItHurts'],
      },
      rewrites: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            cta: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['cta', 'rationale'],
        },
      },
      bestNextAction: { type: 'string' },
      evidence: { type: 'array', items: { type: 'string' } },
    },
    required: ['score', 'diagnosis', 'rewrites', 'bestNextAction', 'evidence'],
  },
  'content-angle-generator': {
    type: 'object',
    additionalProperties: false,
    properties: {
      angles: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            angle: { type: 'string' },
            hook: { type: 'string' },
            format: { type: 'string' },
            rationale: { type: 'string' },
          },
          required: ['angle', 'hook', 'format', 'rationale'],
        },
      },
      notes: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'string' } },
    },
    required: ['angles', 'notes', 'evidence'],
  },
  'caption-optimizer': {
    type: 'object',
    additionalProperties: false,
    properties: {
      optimizedCaption: { type: 'string' },
      openingLine: { type: 'string' },
      structure: { type: 'array', items: { type: 'string' } },
      ctaLine: { type: 'string' },
      doNotUse: { type: 'array', items: { type: 'string' } },
      notes: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'string' } },
    },
    required: ['optimizedCaption', 'openingLine', 'structure', 'ctaLine', 'doNotUse', 'notes', 'evidence'],
  },
  'engagement-diagnostic': {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: {
        type: 'object',
        additionalProperties: false,
        properties: {
          primaryIssue: { type: 'string', enum: ['hook', 'retention', 'positioning', 'cta', 'audience', 'unknown'] },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          oneSentenceDiagnosis: { type: 'string' },
        },
        required: ['primaryIssue', 'confidence', 'oneSentenceDiagnosis'],
      },
      signals: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            signal: { type: 'string' },
            evidence: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'med', 'high'] },
          },
          required: ['signal', 'evidence', 'severity'],
        },
      },
      prioritizedFixes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            why: { type: 'string' },
            how: { type: 'array', items: { type: 'string' } },
            impact: { type: 'string', enum: ['low', 'med', 'high'] },
            effort: { type: 'string', enum: ['low', 'med', 'high'] },
          },
          required: ['title', 'why', 'how', 'impact', 'effort'],
        },
      },
      nextSteps: { type: 'array', items: { type: 'string' } },
      stopDoing: { type: 'array', items: { type: 'string' } },
      experiment: {
        type: 'object',
        additionalProperties: false,
        properties: {
          name: { type: 'string' },
          hypothesis: { type: 'string' },
          steps: { type: 'array', items: { type: 'string' } },
          successMetric: { type: 'string' },
        },
        required: ['name', 'hypothesis', 'steps', 'successMetric'],
      },
      notes: { type: 'array', items: { type: 'string' } },
      evidence: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'signals', 'prioritizedFixes', 'nextSteps', 'stopDoing', 'experiment', 'notes', 'evidence'],
  },
} as const

export const TOOL_AI_CONFIG = {
  'hook-analyzer': {
    model: 'mini',
    system: [
      'You are a 2026 social hook analyst for short-form video.',
      'Return ONLY valid JSON that matches the schema. No markdown. No extra keys.',
      'Score the hook for clarity, curiosity, specificity, and overall hook quality.',
      'Provide concrete rewrites and a tight 6-second plan.',
    ].join('\n'),
  },
  'cta-match-analyzer': {
    model: 'mini',
    system: [
      'You analyze CTA alignment to the content promise.',
      'Return ONLY valid JSON that matches the schema. No markdown. No extra keys.',
      'Be specific about mismatches and provide better CTA rewrites.',
    ].join('\n'),
  },
  'content-angle-generator': {
    model: 'mini',
    system: [
      'You generate non-generic content angles for short-form platforms.',
      'Return ONLY valid JSON that matches the schema. No markdown. No extra keys.',
      'Use the given topic, audience, and constraints to produce distinct angles.',
    ].join('\n'),
  },
  'caption-optimizer': {
    model: 'mini',
    system: [
      'You optimize captions for clarity and conversion without fluff.',
      'Return ONLY valid JSON that matches the schema. No markdown. No extra keys.',
      'Keep the voice consistent and respect forbidden words.',
    ].join('\n'),
  },
  'engagement-diagnostic': {
    model: 'mini',
    system: [
      'You diagnose engagement issues across hook, retention, positioning, and CTA.',
      'Return ONLY valid JSON that matches the schema. No markdown. No extra keys.',
      'If data is missing, infer conservatively and lower confidence.',
    ].join('\n'),
  },
} as const
