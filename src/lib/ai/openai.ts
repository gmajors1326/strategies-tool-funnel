type RunAIJsonParams = {
  system: string
  user: string
  temperature?: number
  model?: string
}

type RunAIJsonError = {
  error: {
    code: 'EMPTY_RESPONSE' | 'BAD_JSON' | 'TIMEOUT' | 'UPSTREAM_ERROR' | 'AI_ERROR'
    message: string
    details?: any
    raw?: string
    status?: number
  }
}

export async function runAIJson(params: RunAIJsonParams): Promise<Record<string, any> | RunAIJsonError> {
  const { system, user, temperature = 0.3, model } = params
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return {
      error: {
        code: 'AI_ERROR',
        message: 'Missing OPENAI_API_KEY in environment.',
      },
    }
  }

  const controller = new AbortController()
  const timeoutMs = 25000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || process.env.OPENAI_MODEL_HEAVY || 'gpt-4.1-mini',
        temperature,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: [
              system,
              '',
              'Return ONLY valid JSON. No markdown. No backticks.',
            ].join('\n'),
          },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    })

    const raw = await response.text()
    if (!raw || !raw.trim()) {
      return {
        error: {
          code: 'EMPTY_RESPONSE',
          message: 'Empty AI response.',
          raw: '',
        },
      }
    }

    if (!response.ok) {
      return {
        error: {
          code: 'UPSTREAM_ERROR',
          message: 'AI request failed with non-2xx response.',
          status: response.status,
          raw,
        },
      }
    }

    try {
      const envelope = JSON.parse(raw)
      if (!envelope || typeof envelope !== 'object') {
        return {
          error: {
            code: 'BAD_JSON',
            message: 'AI response envelope was not an object.',
            raw,
          },
        }
      }

      const content = envelope?.choices?.[0]?.message?.content
      if (!content || typeof content !== 'string' || !content.trim()) {
        return {
          error: {
            code: 'EMPTY_RESPONSE',
            message: 'AI response content was empty.',
            raw,
            details: {
              envelopeSnippet: JSON.stringify(envelope).slice(0, 1200),
            },
          },
        }
      }

      try {
        return JSON.parse(content)
      } catch (contentError) {
        return {
          error: {
            code: 'BAD_JSON',
            message: 'AI response content was not valid JSON.',
            raw,
            details: { content: content.slice(0, 1200) },
          },
        }
      }
    } catch (parseError) {
      return {
        error: {
          code: 'BAD_JSON',
          message: 'AI response was not valid JSON.',
          raw,
        },
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        error: {
          code: 'TIMEOUT',
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
