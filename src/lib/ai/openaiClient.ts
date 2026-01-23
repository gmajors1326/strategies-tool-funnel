// src/lib/ai/openaiClient.ts
import 'server-only'
import OpenAI from 'openai'
import type { ZodSchema } from 'zod'

let _client: OpenAI | null = null

export function getOpenAIClient() {
  if (_client) return _client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in environment.')
  }
  _client = new OpenAI({ apiKey })
  return _client
}

export function pickModel(aiLevel: 'light' | 'heavy' | 'none') {
  if (aiLevel === 'heavy') return process.env.OPENAI_MODEL_HEAVY || 'gpt-4.1-mini'
  if (aiLevel === 'light') return process.env.OPENAI_MODEL_LIGHT || 'gpt-4.1-mini'
  return process.env.OPENAI_MODEL_LIGHT || 'gpt-4.1-mini'
}

export function safetyIdentifierFromUserId(userId: string) {
  // Avoid sending raw emails/usernames. This is a stable-ish identifier.
  // If you want, hash userId here later.
  return `user:${userId}`
}

type StructuredOutputArgs<T> = {
  toolId: string
  input: Record<string, any>
  schema: ZodSchema<T>
  jsonSchema?: Record<string, any>
  model: string
  temperature?: number
  maxOutputTokens?: number
}

type StructuredOutputResult<T> =
  | {
      output: T
      usage: {
        model: string
        inputTokens?: number
        outputTokens?: number
        responseId?: string
      }
    }
  | {
      error: {
        errorCode: 'AI_OUTPUT_INVALID' | 'AI_RESPONSE_EMPTY' | 'AI_RESPONSE_BAD_JSON' | 'AI_PROVIDER_ERROR'
        message: string
        details?: any
      }
    }

function extractTextFromResponse(response: any) {
  if (typeof response?.output_text === 'string' && response.output_text.trim()) {
    return response.output_text.trim()
  }
  const parts: string[] = []
  const output = response?.output ?? []
  for (const item of output) {
    const content = item?.content ?? []
    for (const c of content) {
      if (typeof c?.text === 'string') parts.push(c.text)
    }
  }
  const joined = parts.join('\n').trim()
  return joined || ''
}

async function callResponsesApi(
  client: OpenAI,
  args: StructuredOutputArgs<any>,
  prompt: { system: string; user: string },
  responseFormat?: Record<string, any>
) {
  const payload = {
    model: args.model,
    store: false,
    temperature: args.temperature ?? 0.2,
    max_output_tokens: args.maxOutputTokens ?? 1200,
    response_format: responseFormat,
    input: [
      { role: 'system', content: [{ type: 'input_text', text: prompt.system }] },
      { role: 'user', content: [{ type: 'input_text', text: prompt.user }] },
    ],
  } as any
  return client.responses.create(payload)
}

export async function generateStructuredOutput<T>(
  args: StructuredOutputArgs<T>,
  prompt: { system: string; user: string }
): Promise<StructuredOutputResult<T>> {
  const client = getOpenAIClient()
  const responseFormat = args.jsonSchema
    ? {
        type: 'json_schema',
        json_schema: {
          name: `${args.toolId.replace(/[^a-z0-9_]/gi, '_')}_schema`,
          schema: args.jsonSchema,
        },
      }
    : { type: 'json_object' }

  try {
    const response = await callResponsesApi(client, args, prompt, responseFormat)
    const text = extractTextFromResponse(response)
    if (!text) {
      return {
        error: {
          errorCode: 'AI_RESPONSE_EMPTY',
          message: 'Empty response from AI provider.',
        },
      }
    }

    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      return await repairStructuredOutput(args, prompt, text, err)
    }

    const validated = args.schema.safeParse(parsed)
    if (!validated.success) {
      return await repairStructuredOutput(args, prompt, text, validated.error.flatten())
    }

    return {
      output: validated.data,
      usage: {
        model: args.model,
        inputTokens: response?.usage?.input_tokens,
        outputTokens: response?.usage?.output_tokens,
        responseId: response?.id,
      },
    }
  } catch (err: any) {
    return {
      error: {
        errorCode: 'AI_PROVIDER_ERROR',
        message: err?.message || 'AI provider error.',
        details: err?.type || err,
      },
    }
  }
}

async function repairStructuredOutput<T>(
  args: StructuredOutputArgs<T>,
  prompt: { system: string; user: string },
  badJson: string,
  errorDetails: any
): Promise<StructuredOutputResult<T>> {
  const client = getOpenAIClient()
  const repairSystem = [
    'You are a JSON repair assistant.',
    'Return ONLY valid JSON that matches the schema. No markdown, no extra keys.',
  ].join('\n')
  const repairUser = [
    'The previous output was invalid JSON or failed validation.',
    'Validation errors:',
    JSON.stringify(errorDetails, null, 2),
    'Invalid JSON:',
    badJson,
    'Original instructions:',
    prompt.system,
    'Original user input:',
    prompt.user,
  ].join('\n\n')

  try {
    const response = await callResponsesApi(client, args, { system: repairSystem, user: repairUser }, args.jsonSchema
      ? {
          type: 'json_schema',
          json_schema: {
            name: `${args.toolId.replace(/[^a-z0-9_]/gi, '_')}_schema`,
            schema: args.jsonSchema,
          },
        }
      : { type: 'json_object' })

    const text = extractTextFromResponse(response)
    if (!text) {
      return {
        error: {
          errorCode: 'AI_RESPONSE_EMPTY',
          message: 'Empty response from AI provider after repair.',
        },
      }
    }

    let parsed: any
    try {
      parsed = JSON.parse(text)
    } catch (err) {
      return {
        error: {
          errorCode: 'AI_RESPONSE_BAD_JSON',
          message: 'Failed to parse JSON after repair.',
          details: { error: err, text },
        },
      }
    }

    const validated = args.schema.safeParse(parsed)
    if (!validated.success) {
      return {
        error: {
          errorCode: 'AI_OUTPUT_INVALID',
          message: 'AI output failed validation after repair.',
          details: validated.error.flatten(),
        },
      }
    }

    return {
      output: validated.data,
      usage: {
        model: args.model,
        inputTokens: response?.usage?.input_tokens,
        outputTokens: response?.usage?.output_tokens,
        responseId: response?.id,
      },
    }
  } catch (err: any) {
    return {
      error: {
        errorCode: 'AI_PROVIDER_ERROR',
        message: err?.message || 'AI provider error during repair.',
        details: err?.type || err,
      },
    }
  }
}
