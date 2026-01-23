import OpenAI from 'openai'

type RunAIJsonParams = {
  system: string
  user: string
  temperature?: number
  model?: string
}

type RunAIJsonError = {
  error: {
    code: 'AI_ERROR' | 'AI_TIMEOUT' | 'AI_JSON_PARSE'
    message: string
    details?: any
  }
}

let _client: OpenAI | null = null

function getClient() {
  if (_client) return _client
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY in environment.')
  }
  _client = new OpenAI({ apiKey })
  return _client
}

export async function runAIJson(params: RunAIJsonParams): Promise<Record<string, any> | RunAIJsonError> {
  const { system, user, temperature = 0.3, model } = params
  const client = getClient()

  const controller = new AbortController()
  const timeoutMs = 25000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await client.chat.completions.create(
      {
        model: model || process.env.OPENAI_MODEL_HEAVY || 'gpt-5.2',
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      },
      { signal: controller.signal }
    )

    const content = response.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return {
        error: {
          code: 'AI_ERROR',
          message: 'Empty AI response.',
        },
      }
    }

    try {
      return JSON.parse(content)
    } catch (parseError) {
      return {
        error: {
          code: 'AI_JSON_PARSE',
          message: 'AI response was not valid JSON.',
          details: { sample: content.slice(0, 1200) },
        },
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        error: {
          code: 'AI_TIMEOUT',
          message: 'AI request timed out.',
          details: { timeoutMs },
        },
      }
    }
    return {
      error: {
        code: 'AI_ERROR',
        message: 'AI request failed.',
        details: { message: String(err?.message || err) },
      },
    }
  } finally {
    clearTimeout(timeout)
  }
}
