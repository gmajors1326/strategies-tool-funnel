import { NextRequest, NextResponse } from 'next/server'
import { runEngagementDiagnostic, type EngagementDiagnosticInputs } from '@/lib/tools/engagement-diagnostic'
import { executeTool } from '@/lib/tool-execution'
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
  try {
    const body = await request.json()
    const inputs = diagnosticSchema.parse(body)

    // Run deterministic logic first
    const deterministicOutput = runEngagementDiagnostic(inputs)

    // Execute tool with optional AI enhancement
    const result = await executeTool({
      toolKey: 'engagement-diagnostic',
      inputs,
      deterministicOutput,
      deterministicFn: runEngagementDiagnostic,
      userText: inputs.userText,
      style: 'strategist', // Engagement diagnostic uses strategist style
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

    console.error('Engagement diagnostic error:', error)
    return NextResponse.json(
      { error: 'Failed to run diagnostic' },
      { status: 500 }
    )
  }
}
