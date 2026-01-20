import { NextRequest, NextResponse } from 'next/server'
import { runTool } from '@/lib/ai/runTool'
import { ToolId } from '@/lib/ai/schemas'
import { z } from 'zod'

const runToolSchema = z.object({
  toolId: z.string(),
  inputs: z.record(z.any()),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { toolId, inputs } = runToolSchema.parse(body)

    // Validate toolId
    const validToolIds: ToolId[] = [
      'post_types_to_outperform',
      'why_post_failed',
      'hook_pressure_test',
      'retention_leak_finder',
      'algorithm_training_mode',
    ]

    if (!validToolIds.includes(toolId as ToolId)) {
      return NextResponse.json(
        { error: `Invalid toolId: ${toolId}` },
        { status: 400 }
      )
    }

    // Run the tool
    const result = await runTool({
      toolId: toolId as ToolId,
      inputs,
      retryOnInvalid: true,
    })

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to run tool',
          output: result.output, // Include fallback output if available
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      output: result.output,
      retried: result.retried,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('[tools/run] Error:', error)
    return NextResponse.json(
      { error: 'Failed to run tool' },
      { status: 500 }
    )
  }
}
