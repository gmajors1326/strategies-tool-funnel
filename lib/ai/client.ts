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

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const provider = (process.env.AI_PROVIDER || 'openai') as AIProvider

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
    
    // Handle specific OpenAI API errors
    if (error.status === 429) {
      if (error.message?.includes('quota')) {
        throw new Error('OpenAI quota exceeded. Please check your billing and spending limits at https://platform.openai.com/account/billing. You may need to add a payment method or increase your spending limit.')
      } else {
        throw new Error('OpenAI rate limit exceeded. Please try again in a moment.')
      }
    }
    
    if (error.status === 401) {
      throw new Error('Invalid OpenAI API key. Please check your OPENAI_API_KEY environment variable.')
    }
    
    if (error.status === 402) {
      throw new Error('OpenAI payment required. Please add a payment method at https://platform.openai.com/account/billing')
    }
    
    throw new Error(`AI call failed: ${error.message || 'Unknown error'}`)
  }
}
