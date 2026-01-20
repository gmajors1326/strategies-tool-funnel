import { callAI } from './client'
import { GLOBAL_SYSTEM_PROMPT } from './globalSystemPrompt'
import { getToolPrompt } from './prompts'
import { ToolId, toolSchemas } from './schemas'

export interface RunToolOptions {
  toolId: ToolId
  inputs: Record<string, any>
  retryOnInvalid?: boolean
}

export interface RunToolResult {
  success: boolean
  output?: Record<string, any>
  error?: string
  retried?: boolean
}

function parseJSONSafely(text: string): any {
  // Try to extract JSON from markdown code blocks
  const jsonMatch = text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1])
  }

  // Try to find JSON object in the text
  const jsonObjectMatch = text.match(/\{[\s\S]*\}/)
  if (jsonObjectMatch) {
    return JSON.parse(jsonObjectMatch[0])
  }

  // Try parsing the whole thing
  return JSON.parse(text)
}

function createFallbackOutput(toolId: ToolId): Record<string, any> {
  const base = {
    confidence_level: 'low' as const,
    evidence: ['Insufficient signal to provide confident recommendations'],
  }

  switch (toolId) {
    case 'why_post_failed':
      return {
        ...base,
        primary_failure: 'Insufficient signal',
        one_fix: 'Provide all required inputs: post_type, primary_goal, metrics (views, avg_watch_time_sec, saves, profile_visits), and all checkboxes.',
        do_not_change: ['Post type', 'Goal', 'Delivery style'],
        recommended_next_post_type: 'Pattern-Breaker',
        one_sentence_reasoning: 'Cannot diagnose without complete input data.',
      }
    case 'hook_pressure_test':
      return {
        ...base,
        verdict: 'insufficient_signal',
        what_it_triggers: 'none',
        strongest_flaw: 'No hook provided for evaluation',
        one_fix: 'Provide a hook text to pressure-test',
        rewrites: {
          curiosity: ['Example curiosity rewrite 1', 'Example curiosity rewrite 2'],
          threat: ['Example threat rewrite 1', 'Example threat rewrite 2'],
          status: ['Example status rewrite 1', 'Example status rewrite 2'],
        },
        micro_opening_frame: 'Provide a hook to get opening frame suggestions',
      }
    case 'retention_leak_finder':
      return {
        ...base,
        primary_leak: 'Insufficient signal',
        likely_cause: 'Missing video_length_sec or avg_watch_time_sec',
        one_structural_fix: 'Provide video_length_sec and avg_watch_time_sec to identify the retention leak',
        cut_list: ['Provide metrics to get specific cuts', 'Run analysis with complete data', 'Test after implementing fixes'],
        loop_tweak: 'Provide metrics to get loop tweak suggestions',
      }
    case 'algorithm_training_mode':
      return {
        ...base,
        training_thesis: 'Insufficient signal. Provide training_goal, target_audience, and core_topic to design a training sequence.',
        sequence: [],
        guardrails: [
          'Provide all required inputs to get guardrails',
          'Training goal, audience, and topic are required',
          'Cannot design sequence without complete information',
          'Fill in all fields and try again',
        ],
        one_spicy_experiment: 'Provide inputs to get experiment suggestion',
      }
    case 'post_type_recommender':
      return {
        ...base,
        recommended_post_type: 'Insufficient signal',
        one_liner: 'Select a primary goal to get a recommendation.',
        rules_to_execute: ['Select your primary growth goal', 'Provide account context if available', 'Review the recommended post type'],
        do_list: ['Follow the execution rules', 'Use the provided examples as templates', 'Test one variation at a time'],
        dont_list: ['Mix multiple post types', 'Skip the execution rules', 'Overthink the recommendation'],
        hook_examples: ['Example hook 1', 'Example hook 2', 'Example hook 3', 'Example hook 4', 'Example hook 5'],
        caption_examples: ['Example caption 1', 'Example caption 2', 'Example caption 3'],
        soft_cta_suggestions: ['Save this post', 'Follow for more', 'DM me'],
        spicy_experiment: 'Test this post type with a different hook style.',
      }
    case 'cta_match_checker':
      return {
        ...base,
        match_verdict: 'Insufficient signal',
        why_short: 'Provide post_goal and current_cta_text to evaluate CTA match.',
        best_single_action: 'save',
        rewritten_ctas: [
          'Provide post goal and CTA to get rewrites',
          'Define clear goal and current CTA text',
          'Include audience temperature if known',
          'Specify post type for better alignment',
          'Fill in all required fields and try again',
        ],
        placement_instruction: 'Provide inputs to get placement instruction',
      }
    case 'follower_quality_filter':
      return {
        ...base,
        positioning_sentence: 'Insufficient signal. Provide ideal_follower_one_liner to get positioning.',
        language_to_use: ['Provide ideal follower description', 'Define target audience clearly', 'Specify niche if applicable', 'Describe current problem', 'Be specific about who you serve', 'Use clear identity markers', 'Focus on outcomes they want', 'Avoid generic language'],
        language_to_avoid: ['Generic buzzwords', 'Overused phrases', 'Vague positioning', 'Try-hard language', 'Trendy terms', 'Empty promises', 'Cliché statements', 'Weak qualifiers'],
        post_types_to_attract: ['Identity Alignment Posts', 'Calm Insight Reels', 'Soft Direction Posts'],
        post_types_to_repel: ['Pattern-Breaker Posts', 'Framework / Mental Model Posts', 'Before/After Thinking Shifts'],
        bio_line_optional: 'Provide ideal follower description to get bio line.',
      }
    case 'content_system_builder':
      return {
        ...base,
        system_name: 'Insufficient signal. Provide primary_goal, posting_days_per_week, time_per_post, and niche.',
        weekly_plan: [],
        nonnegotiables: ['Provide all required inputs', 'Goal and capacity are required', 'Cannot build system without complete information'],
        templates: [],
      }
    case 'what_to_stop_posting':
      return {
        ...base,
        stop_list: [],
        keep_list: ['Provide recent posts summary', 'Include at least 5 recent posts', 'Describe results for each post'],
        one_rule_to_enforce: 'Provide recent_posts_summary with at least 5 posts to get stop list.',
      }
    case 'controlled_experiment_planner':
      return {
        ...base,
        hypothesis: 'Insufficient signal. Provide objective, baseline_description, duration_days, and posting_count.',
        control_definition: 'Provide inputs to get control definition',
        variable_to_change: 'Provide inputs to get variable',
        test_matrix: [],
        success_metric: 'Provide inputs to get success metric',
        decision_rule: 'Provide inputs to get decision rule',
      }
    case 'signal_vs_noise_analyzer':
      return {
        ...base,
        metric_weights: [],
        north_star_metric: 'Insufficient signal',
        ignore_list: ['Provide account stage and primary goal'],
        weekly_review_questions: ['Provide inputs to get review questions'],
      }
    case 'ai_hook_rewriter':
      return {
        ...base,
        hooks: [],
        best_3: [0, 1, 2],
        opening_frame_suggestions: ['Provide topic and post type to get suggestions'],
      }
    case 'weekly_strategy_review':
      return {
        ...base,
        one_pattern: 'Insufficient signal',
        one_change_next_week: 'Provide week summary to get recommendations',
        keep_doing: ['Provide week summary'],
        stop_doing: ['Provide week summary'],
        next_week_plan: [],
      }
    case 'dm_intelligence_engine':
      return {
        ...base,
        recommended_reply: 'Provide last incoming message and context to get reply',
        reasoning_summary: 'Insufficient signal',
        risk_assessment: {
          level: 'low',
          flags: [],
          avoid_saying: [],
        },
        next_step: {
          objective: 'Provide context',
          question_to_ask: 'Provide context',
          fallback_if_no_reply: 'Provide context',
        },
      }
    case 'hook_repurposer':
      return {
        ...base,
        best_angle: 'curiosity',
        hooks: [],
        angle_labels: [],
        pattern_break_openers: ['Provide original hook to get repurposed hooks'],
      }
    case 'engagement_diagnostic_lite':
      return {
        ...base,
        tier: 'stalled',
        primary_bottleneck: 'insufficient_signal',
        one_actionable_insight: 'Provide followers and average reel views',
        one_next_action: 'Provide inputs to get next action',
      }
    case 'dm_opener_generator_lite':
      return {
        ...base,
        opener: 'Provide context and purpose to get opener',
        follow_up_if_seen_no_reply: 'Provide context to get follow-up',
      }
    default:
      return base
  }
}

export async function runTool(options: RunToolOptions): Promise<RunToolResult> {
  const { toolId, inputs, retryOnInvalid = true } = options

  const schema = toolSchemas[toolId]
  const toolPrompt = getToolPrompt(toolId)

  if (!schema || !toolPrompt) {
    return {
      success: false,
      error: `Tool ${toolId} not found in registry`,
    }
  }

  const systemPrompt = `${GLOBAL_SYSTEM_PROMPT}\n\n${toolPrompt}`
  
  const userMessage = `Tool: ${toolId}\n\nUser Inputs:\n${JSON.stringify(inputs, null, 2)}\n\nOutput Requirements:\nYou must return ONLY valid JSON matching this exact schema:\n${JSON.stringify(schema.shape, null, 2)}\n\nReturn ONLY the JSON object. No markdown, no explanations.`

  try {
    // First attempt
    let responseText = await callAI(systemPrompt, userMessage)
    let parsed: any

    try {
      parsed = parseJSONSafely(responseText)
    } catch (parseError) {
      if (!retryOnInvalid) {
        return {
          success: false,
          error: 'Failed to parse AI response as JSON',
          output: createFallbackOutput(toolId),
        }
      }

      // Retry with repair prompt
      const repairPrompt = `The previous response was not valid JSON. You MUST output ONLY valid JSON matching this schema:\n${JSON.stringify(schema.shape, null, 2)}\n\nPrevious invalid response:\n${responseText}\n\nPlease output ONLY the JSON object. No markdown, no explanations, no code blocks. Just the raw JSON.`

      try {
        responseText = await callAI(systemPrompt, repairPrompt)
        parsed = parseJSONSafely(responseText)
      } catch (retryError) {
        return {
          success: false,
          error: 'Failed to parse AI response after retry',
          output: createFallbackOutput(toolId),
          retried: true,
        }
      }
    }

    // Validate against schema
    const validationResult = schema.safeParse(parsed)

    if (!validationResult.success) {
      if (!retryOnInvalid) {
        return {
          success: false,
          error: 'AI response does not match schema',
          output: createFallbackOutput(toolId),
        }
      }

      // Retry with repair prompt
      const repairPrompt = `The previous JSON response did not match the required schema. Errors:\n${JSON.stringify(validationResult.error.errors, null, 2)}\n\nYou MUST output valid JSON matching this exact schema:\n${JSON.stringify(schema.shape, null, 2)}\n\nPrevious invalid response:\n${JSON.stringify(parsed, null, 2)}\n\nPlease output ONLY the corrected JSON object.`

      try {
        responseText = await callAI(systemPrompt, repairPrompt)
        parsed = parseJSONSafely(responseText)
        const retryValidation = schema.safeParse(parsed)

        if (!retryValidation.success) {
          return {
            success: false,
            error: 'AI response still invalid after retry',
            output: createFallbackOutput(toolId),
            retried: true,
          }
        }

        return {
          success: true,
          output: retryValidation.data,
          retried: true,
        }
      } catch (retryError) {
        return {
          success: false,
          error: 'Failed to repair invalid response',
          output: createFallbackOutput(toolId),
          retried: true,
        }
      }
    }

    return {
      success: true,
      output: validationResult.data,
    }
  } catch (error: any) {
    console.error(`[runTool] Error running tool ${toolId}:`, error)
    return {
      success: false,
      error: error.message || 'Unknown error',
      output: createFallbackOutput(toolId),
    }
  }
}
