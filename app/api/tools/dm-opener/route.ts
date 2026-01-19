import { NextRequest, NextResponse } from 'next/server'
import { generateDMOpener, type DMOpenerInputs } from '@/lib/tools/dm-opener'
import { executeTool } from '@/lib/tool-execution'
import { z } from 'zod'

const openerSchema = z.object({
  scenario: z.enum(['commenter', 'story reply', 'inbound DM', 'warm lead', 'cold-ish lead']),
  tone: z.enum(['friendly', 'direct', 'playful', 'professional']),
  intent: z.enum(['start convo', 'qualify', 'soft invite', 'book call']),
  save: z.boolean().optional(),
  userText: z.string().max(2000).optional(), // Optional user-provided context (bio, post, DM)
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const inputs = openerSchema.parse(body)

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

    console.error('DM opener error:', error)
    return NextResponse.json(
      { error: 'Failed to generate opener' },
      { status: 500 }
    )
  }
}
