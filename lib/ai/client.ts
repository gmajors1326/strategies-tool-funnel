import OpenAI from 'openai'

export type AIProvider = 'openai' | 'anthropic' | 'other'

export interface AIClientConfig {
  provider: AIProvider
  apiKey: string
  model: string
  temperature?: number
  maxTokens?: number
}

let clientInstance: OpenAI | null = null

export function getAIClient(): OpenAI {
  if (clientInstance) {
    return clientInstance
  }

  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('AI_API_KEY or OPENAI_API_KEY environment variable is required')
  }

  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider
  const model = process.env.AI_MODEL || 'gpt-4-turbo-preview'

  if (provider !== 'openai') {
    throw new Error(`Provider ${provider} not yet implemented. Only OpenAI is supported.`)
  }

  clientInstance = new OpenAI({
    apiKey,
  })

  return clientInstance
}

export async function callAI(
  systemPrompt: string,
  userMessage: string,
  options?: {
    temperature?: number
    maxTokens?: number
    model?: string
  }
): Promise<string> {
  const client = getAIClient()
  
  const temperature = options?.temperature ?? parseFloat(process.env.AI_TEMPERATURE || '0.2')
  const maxTokens = options?.maxTokens ?? parseInt(process.env.AI_MAX_TOKENS || '800')
  const model = options?.model || process.env.AI_MODEL || 'gpt-4-turbo-preview'

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No content in AI response')
    }

    return content
  } catch (error: any) {
    console.error('[AI] Error calling AI:', error)
    throw new Error(`AI call failed: ${error.message}`)
  }
}
