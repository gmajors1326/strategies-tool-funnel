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
      'why_post_failed',
      'hook_pressure_test',
      'retention_leak_finder',
      'algorithm_training_mode',
      'post_type_recommender',
    ]

    if (!validToolIds.includes(toolId as ToolId)) {
      return NextResponse.json(
        { error: `Invalid toolId: ${toolId}` },
        { status: 400 }
      )
    }

    // Structure inputs for specific tools
    let structuredInputs = inputs
    if (toolId === 'why_post_failed') {
      structuredInputs = {
        post_type: inputs.post_type,
        primary_goal: inputs.primary_goal,
        metrics: {
          views: Number(inputs.views) || 0,
          avg_watch_time_sec: Number(inputs.avg_watch_time_sec) || 0,
          retention_pct_optional: inputs.retention_pct_optional ? Number(inputs.retention_pct_optional) : null,
          saves: Number(inputs.saves) || 0,
          profile_visits: Number(inputs.profile_visits) || 0,
        },
        checkboxes: {
          hook_felt_strong: inputs.hook_felt_strong === true || inputs.hook_felt_strong === 'true',
          looped_cleanly: inputs.looped_cleanly === true || inputs.looped_cleanly === 'true',
          one_clear_idea: inputs.one_clear_idea === true || inputs.one_clear_idea === 'true',
          calm_delivery: inputs.calm_delivery === true || inputs.calm_delivery === 'true',
          single_cta: inputs.single_cta === true || inputs.single_cta === 'true',
        },
        notes_optional: inputs.notes_optional || null,
      }
    } else if (toolId === 'retention_leak_finder') {
      // Parse retention_points_optional if it's a JSON string
      let retentionPoints = null
      if (inputs.retention_points_optional) {
        try {
          retentionPoints = typeof inputs.retention_points_optional === 'string'
            ? JSON.parse(inputs.retention_points_optional)
            : inputs.retention_points_optional
        } catch {
          retentionPoints = null
        }
      }
      
      structuredInputs = {
        video_length_sec: Number(inputs.video_length_sec) || 0,
        avg_watch_time_sec: Number(inputs.avg_watch_time_sec) || 0,
        retention_points_optional: retentionPoints,
        known_drop_second_optional: inputs.known_drop_second_optional ? Number(inputs.known_drop_second_optional) : null,
        format_optional: inputs.format_optional || null,
        notes_optional: inputs.notes_optional || null,
      }
    }

    // Run the tool
    const result = await runTool({
      toolId: toolId as ToolId,
      inputs: structuredInputs,
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
