import { NextRequest, NextResponse } from 'next/server'
import { executeTool } from '@/lib/tool-execution'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'
import { z } from 'zod'

const diagnosticSchema = z.object({
  followerRange: z.enum(['0-500', '500-2k', '2k-10k', '10k+']),
  postingFrequency: z.enum(['rarely', '1-2x/week', '3-5x/week', 'daily-ish']),
  dailyEngagementTime: z.enum(['0-5', '5-15', '15-30', '30+']),
  primaryGoal: z.enum(['growth', 'DMs', 'sales', 'authority']),
  biggestFriction: z.enum(['no reach', 'low engagement', 'no DMs', 'no sales', 'burnout']),
  save: z.boolean().optional(),
  userText: z.string().max(2000).optional(), // Optional user-provided context
})

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const pathname = request.nextUrl.pathname

  try {
    const body = await request.json()
    const inputs = diagnosticSchema.parse(body)

    logger.debug('Engagement diagnostic request', {
      followerRange: inputs.followerRange,
      primaryGoal: inputs.primaryGoal,
    })

    // Execute tool with AI (required)
    const result = await executeTool({
      toolKey: 'engagement-diagnostic',
      inputs,
      userText: inputs.userText,
      style: 'strategist', // Engagement diagnostic uses strategist style
      save: inputs.save,
    })

    const duration = Date.now() - startTime
    logger.apiRequest('POST', pathname, 200, duration, {
      toolKey: 'engagement-diagnostic',
    })

    return NextResponse.json({
      success: true,
      outputs: result.outputs,
      saved: result.saved,
      aiUsageRemaining: result.aiUsageRemaining,
    })
  } catch (error) {
    const duration = Date.now() - startTime

    if (error instanceof z.ZodError) {
      logger.apiRequest('POST', pathname, 400, duration, {
        toolKey: 'engagement-diagnostic',
        validationErrors: error.errors,
      })
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logger.error('Engagement diagnostic error', error as Error, {
      toolKey: 'engagement-diagnostic',
      duration,
    })

    if (error instanceof Error) {
      captureException(error, {
        toolKey: 'engagement-diagnostic',
        path: pathname,
      })
    }

    logger.apiRequest('POST', pathname, 500, duration, {
      toolKey: 'engagement-diagnostic',
      error: errorMessage,
    })

    return NextResponse.json(
      { error: errorMessage || 'Failed to run diagnostic' },
      { status: 500 }
    )
  }
}
