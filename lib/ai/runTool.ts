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
        retention_score: 5,
        leak_points: [{ timestamp: 'midway', issue: 'Need more data', impact: 'medium', fix: 'Test different content structure' }],
        overall_pattern: 'Insufficient data to identify pattern',
        quick_fixes: ['Test shorter content', 'Improve hook'],
        long_term_strategy: 'Run controlled tests to identify what works',
      }
    case 'algorithm_training_mode':
      return {
        ...base,
        training_status: 'partially_trained',
        signals_sent: [{ signal: 'Need more data', strength: 'weak', explanation: 'Insufficient signal' }],
        missing_signals: ['Consistent posting', 'Clear content pattern'],
        next_post_recommendations: ['Post consistently', 'Test different content types'],
        content_pattern_analysis: 'Need more data to analyze pattern',
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
