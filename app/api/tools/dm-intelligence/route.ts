import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { executeTool } from '@/lib/tool-execution'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'
import { z } from 'zod'

const MAX_CONVERSATION_SNIPPET_LENGTH = 1200

const dmIntelligenceSchema = z.object({
  scenario: z.enum(['commenter', 'story_reply', 'inbound_dm', 'warm_lead', 'coldish_lead']),
  intent: z.enum(['continue_convo', 'qualify', 'soft_invite', 'book_call']),
  tone: z.enum(['calm', 'friendly', 'playful', 'professional', 'direct']),
  conversationSnippet: z.string().min(10).max(MAX_CONVERSATION_SNIPPET_LENGTH),
  offerType: z.enum(['service', 'course', 'digital_product', 'none']).optional(),
  boundary: z.enum(['no_pitch', 'soft_pitch_ok', 'direct_pitch_ok']).optional(),
  style: z.enum(['strategist', 'closer']).optional(),
  save: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const inputs = dmIntelligenceSchema.parse(body)

    // Check session (required for AI tools)
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    logger.debug('DM Intelligence request', {
      scenario: inputs.scenario,
      intent: inputs.intent,
      tone: inputs.tone,
    })

    // Execute tool with AI (required)
    const result = await executeTool({
      toolKey: 'dm_intelligence_engine',
      inputs: {
        platform: 'instagram',
        relationship_stage: inputs.scenario.replace('_', ''),
        goal: inputs.intent.replace('_', ' '),
        last_incoming_message: inputs.conversationSnippet,
        last_outgoing_message_optional: null,
        tone: inputs.tone,
        compliance_sensitivity: inputs.boundary === 'no_pitch' ? 'high' : inputs.boundary === 'direct_pitch_ok' ? 'low' : 'medium',
      },
      userText: inputs.conversationSnippet,
      style: inputs.style || 'closer',
      save: inputs.save !== false, // Default to saving
    })

    return NextResponse.json({
      success: true,
      outputs: result.outputs,
      saved: result.saved,
      aiUsageRemaining: result.aiUsageRemaining,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('DM Intelligence Engine error', error as Error, {
      toolKey: 'dm_intelligence_engine',
    })

    if (error instanceof Error) {
      captureException(error, {
        toolKey: 'dm_intelligence_engine',
      })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run DM Intelligence Engine' },
      { status: 500 }
    )
  }
}
