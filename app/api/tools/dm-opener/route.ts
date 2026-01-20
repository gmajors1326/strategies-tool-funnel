import { NextRequest, NextResponse } from 'next/server'
import { generateDMOpener } from '@/lib/tools/dm-opener'
import { executeTool } from '@/lib/tool-execution'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'
import { z } from 'zod'

const openerSchema = z.object({
  scenario: z.enum(['commenter', 'story reply', 'inbound DM', 'warm lead', 'cold-ish lead']),
  tone: z.enum(['friendly', 'direct', 'playful', 'professional']),
  intent: z.enum(['start convo', 'qualify', 'soft invite', 'book call']),
  save: z.boolean().optional(),
  userText: z.string().max(2000).optional(), // Optional user-provided context (bio, post, DM)
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname

  try {
    const body = await request.json()
    const inputs = openerSchema.parse(body)

    logger.debug('DM opener request', {
      scenario: inputs.scenario,
      tone: inputs.tone,
      intent: inputs.intent,
    })

    // Run deterministic logic first
    const deterministicOutput = generateDMOpener(inputs)

    // Execute tool with optional AI enhancement
    const result = await executeTool({
      toolKey: 'dm-opener',
      inputs,
      deterministicOutput,
      deterministicFn: generateDMOpener,
      userText: inputs.userText,
      style: 'closer', // DM tools use closer style
      save: inputs.save,
    })

    const duration = Date.now() - startTime
    logger.apiRequest('POST', pathname, 200, duration, {
      toolKey: 'dm-opener',
      enhanced: result.enhanced,
    })

    return NextResponse.json({
      success: true,
      outputs: result.outputs,
      saved: result.saved,
      enhanced: result.enhanced,
      aiUsageRemaining: result.aiUsageRemaining,
    })
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      logger.apiRequest('POST', pathname, 400, duration, {
        toolKey: 'dm-opener',
        validationErrors: error.errors,
      })

      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    // Log and capture error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('DM opener error', error, {
      toolKey: 'dm-opener',
      duration,
    })

    // Capture to Sentry
    if (error instanceof Error) {
      captureException(error, {
        toolKey: 'dm-opener',
        path: pathname,
      })
    }

    logger.apiRequest('POST', pathname, 500, duration, {
      toolKey: 'dm-opener',
      error: errorMessage,
    })

    return NextResponse.json(
      { error: 'Failed to generate opener' },
      { status: 500 }
    )
  }
}
