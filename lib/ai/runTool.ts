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
        secondary_issues: ['Need more data'],
        one_fix: 'Run a controlled test: change only the hook.',
        hook_analysis: { strength: 'weak', suggestion: 'Test a different hook' },
        caption_analysis: { length_appropriate: true, suggestion: 'Keep testing' },
        cta_analysis: { present: false, effective: false, suggestion: 'Add a soft CTA' },
        visual_analysis: { engaging: false, suggestion: 'Test different visuals' },
        next_post_recommendation: 'Run a controlled test with one variable changed',
      }
    case 'hook_pressure_test':
      return {
        ...base,
        hook_strength: 'medium',
        scroll_stop_power: 5,
        curiosity_gap: 'medium',
        issues: ['Need more context'],
        improvements: ['Test different variations'],
        alternative_hooks: ['Alternative 1', 'Alternative 2', 'Alternative 3'],
        recommended_action: 'Test this hook and compare results',
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
