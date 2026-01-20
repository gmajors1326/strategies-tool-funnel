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
      'cta_match_checker',
      'follower_quality_filter',
      'content_system_builder',
      'what_to_stop_posting',
      'controlled_experiment_planner',
      'signal_vs_noise_analyzer',
      'ai_hook_rewriter',
      'weekly_strategy_review',
      'dm_intelligence_engine',
      'hook_repurposer',
      'engagement_diagnostic_lite',
      'dm_opener_generator_lite',
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
      // Parse retention_points_optional - can be user-friendly format or JSON
      let retentionPoints = null
      if (inputs.retention_points_optional) {
        const inputStr = String(inputs.retention_points_optional).trim()
        
        // Try parsing as JSON first
        try {
          retentionPoints = JSON.parse(inputStr)
        } catch {
          // If not JSON, parse user-friendly format like "1s → 80%, 3s → 60%"
          // Extract patterns like "1s → 80%" or "3s → 60%"
          const matches = inputStr.match(/(\d+)s\s*→\s*(\d+)%/g)
          if (matches && matches.length > 0) {
            retentionPoints = matches.map(match => {
              const parts = match.match(/(\d+)s\s*→\s*(\d+)%/)
              if (parts) {
                return {
                  second: parseInt(parts[1]),
                  retention_pct: parseInt(parts[2])
                }
              }
              return null
            }).filter(Boolean)
          } else {
            // Keep as string if can't parse
            retentionPoints = inputStr
          }
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
    } else if (toolId === 'algorithm_training_mode') {
      structuredInputs = {
        training_goal: inputs.training_goal,
        target_audience: inputs.target_audience,
        core_topic: inputs.core_topic,
        preferred_format: inputs.preferred_format,
        days: inputs.days,
        posting_capacity: inputs.posting_capacity,
      }
    } else if (toolId === 'what_to_stop_posting') {
      // Handle plain-language input - convert option labels back to snake_case for API
      let recurringIssue = inputs.recurring_issues_optional || null
      if (recurringIssue) {
        const issueMap: Record<string, string> = {
          'Low reach': 'low_reach',
          'Low retention': 'low_retention',
          'No saves': 'no_saves',
          'No DMs': 'no_dms',
        }
        recurringIssue = issueMap[recurringIssue] || recurringIssue
      }
      
      structuredInputs = {
        recent_posts_summary: inputs.recent_posts_summary || '',
        recurring_issues_optional: recurringIssue,
        niche_optional: inputs.niche_optional || null,
      }
    } else if (toolId === 'signal_vs_noise_analyzer') {
      structuredInputs = {
        account_stage: inputs.account_stage,
        primary_goal: inputs.primary_goal,
        metrics_available: typeof inputs.metrics_available === 'string' 
          ? inputs.metrics_available.split(',').map(m => m.trim())
          : inputs.metrics_available,
        last_14_days_optional: inputs.last_14_days_optional || null,
      }
    } else if (toolId === 'ai_hook_rewriter') {
      structuredInputs = {
        topic: inputs.topic,
        post_type: inputs.post_type,
        target_emotion: inputs.target_emotion,
        constraints_optional: {
          max_words: inputs.max_words || 12,
          banned_words: inputs.banned_words ? (typeof inputs.banned_words === 'string' ? inputs.banned_words.split(',').map(w => w.trim()) : inputs.banned_words) : [],
        },
        must_include_optional: inputs.must_include_optional || null,
      }
    } else if (toolId === 'weekly_strategy_review') {
      structuredInputs = {
        week_summary: typeof inputs.week_summary === 'string' ? inputs.week_summary : inputs.week_summary,
        biggest_question: inputs.biggest_question,
        time_available_next_week: inputs.time_available_next_week,
      }
    } else if (toolId === 'dm_intelligence_engine') {
      structuredInputs = {
        context: {
          platform: inputs.platform,
          relationship_stage: inputs.relationship_stage,
          goal: inputs.goal,
        },
        conversation: {
          last_incoming_message: inputs.last_incoming_message,
          last_outgoing_message_optional: inputs.last_outgoing_message_optional || null,
        },
        constraints: {
          tone: inputs.tone,
          compliance_sensitivity: inputs.compliance_sensitivity,
        },
      }
    } else if (toolId === 'hook_repurposer') {
      structuredInputs = {
        original_hook: inputs.original_hook,
        topic_optional: inputs.topic_optional || null,
        constraints: {
          max_words: inputs.max_words || 12,
          tone: inputs.tone,
        },
      }
    } else if (toolId === 'engagement_diagnostic_lite') {
      structuredInputs = {
        metrics: {
          followers: inputs.followers,
          avg_reel_views: inputs.avg_reel_views,
          avg_watch_time_sec_optional: inputs.avg_watch_time_sec_optional || null,
          avg_saves_optional: inputs.avg_saves_optional || null,
        },
        posting: {
          posts_per_week: inputs.posts_per_week,
          primary_format: inputs.primary_format,
        },
        goal: inputs.goal,
      }
    } else if (toolId === 'dm_opener_generator_lite') {
      structuredInputs = {
        scenario: {
          purpose: inputs.purpose,
          context: inputs.context,
          what_you_want: inputs.what_you_want,
        },
        tone: inputs.tone,
        constraints: {
          max_chars: inputs.max_chars || 240,
        },
      }
    } else if (toolId === 'controlled_experiment_planner') {
      structuredInputs = {
        objective: inputs.objective,
        baseline_description: inputs.baseline_description,
        variable_options_optional: inputs.variable_options_optional || null,
        duration_days: Number(inputs.duration_days) || 7,
        posting_count: Number(inputs.posting_count) || 5,
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
