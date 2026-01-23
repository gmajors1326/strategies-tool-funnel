import { NextResponse } from 'next/server'
import { getOpenAIClient, pickModel } from '@/src/lib/ai/openaiClient'

export const dynamic = 'force-dynamic'

function extractText(response: any) {
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
  return parts.join('\n').trim()
}

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Not available in production.' }, { status: 404 })
  }

  const requestId = crypto.randomUUID()
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Missing OPENAI_API_KEY.', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }

  try {
    const client = getOpenAIClient()
    const model = pickModel('light')
    const response = await client.responses.create({
      model,
      store: false,
      temperature: 0,
      max_output_tokens: 120,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'ai_health_check',
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              ok: { type: 'boolean' },
              message: { type: 'string' },
            },
            required: ['ok', 'message'],
          },
          strict: true,
        },
      },
      input: [
        {
          role: 'system',
          content: [{ type: 'input_text', text: 'Return JSON for a basic health check.' }],
        },
        {
          role: 'user',
          content: [{ type: 'input_text', text: 'Respond with ok true and a short message.' }],
        },
      ],
    })

    const text = extractText(response)
    const parsed = text ? JSON.parse(text) : null
    if (!parsed || typeof parsed.ok !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'Invalid AI response.', requestId },
        { status: 502, headers: { 'x-request-id': requestId } }
      )
    }

    return NextResponse.json(
      { ok: true, model, responseId: response?.id, requestId, output: parsed },
      { status: 200, headers: { 'x-request-id': requestId } }
    )
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'AI health check failed.', requestId },
      { status: 500, headers: { 'x-request-id': requestId } }
    )
  }
}
