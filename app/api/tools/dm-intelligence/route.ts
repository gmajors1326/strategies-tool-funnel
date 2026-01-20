import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { runDMIntelligence } from '@/lib/tools/dm-intelligence'
import { executeTool } from '@/lib/tool-execution'
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

    // Check session (optional - allow anonymous users)
    await getSession()

    // Run deterministic logic first
    const deterministicOutput = runDMIntelligence(inputs)

    // Execute tool with optional AI enhancement
    const result = await executeTool({
      toolKey: 'dm_intelligence_engine',
      inputs,
      deterministicOutput: deterministicOutput as any,
      deterministicFn: runDMIntelligence,
      userText: inputs.conversationSnippet,
      style: inputs.style || 'closer',
      save: inputs.save !== false, // Default to saving
    })

    return NextResponse.json({
      success: true,
      outputs: result.outputs,
      saved: result.saved,
      enhanced: result.enhanced,
      aiUsageRemaining: result.aiUsageRemaining,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('DM Intelligence Engine error:', error)
    return NextResponse.json(
      { error: 'Failed to run DM Intelligence Engine' },
      { status: 500 }
    )
  }
}
