import OpenAI from 'openai'
import { prisma } from './db'
import { DIGITAL_PRODUCT_MASTER_PROMPT, isProductRelatedTool } from './ai/digitalProductMasterPrompt'

const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || process.env.AI_API_KEY)?.trim()
const OPENAI_MODEL = process.env.OPENAI_MODEL?.trim() || 'gpt-4-turbo-preview'

let openaiClient: OpenAI | null = null

if (OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: OPENAI_API_KEY,
  })
}

export type AiStyle = 'strategist' | 'closer'

export interface AiEnhancementRequest {
  toolKey: string
  inputs: Record<string, any>
  deterministicOutput?: Record<string, any> // Optional - kept for backward compatibility but not used
  userText?: string // Optional user-provided text (bio, caption, DM) with strict length limits
  style: AiStyle
  knowledgeChunks: string[]
  promptProfile: {
    dos: string
    donts: string
    bannedPhrases: string[]
    toneNotes: string
  }
  rubric: {
    inputHints: string
    outputSchema: Record<string, any>
    reasoningRules: string
    safetyRules: string
  }
}

export interface AiEnhancementResponse {
  enhancedOutput: Record<string, any>
  explanation: string
  tokensIn?: number
  tokensOut?: number
  costEstimate?: number
}

const MAX_USER_TEXT_LENGTH = 2000 // Strict limit for user-provided text

export async function enhanceWithAi(
  request: AiEnhancementRequest
): Promise<AiEnhancementResponse> {
  if (!openaiClient) {
    throw new Error('AI service not configured. Set OPENAI_API_KEY (or AI_API_KEY) environment variable.')
  }

  // Enforce user text length limit
  const userText = request.userText
    ? request.userText.slice(0, MAX_USER_TEXT_LENGTH)
    : undefined

  // Build knowledge context
  const knowledgeContext = request.knowledgeChunks
    .slice(0, 10) // Max 10 chunks
    .map((chunk, idx) => `[Knowledge ${idx + 1}]\n${chunk}`)
    .join('\n\n')

  // Check if this is a product-related tool
  const isProductTool = isProductRelatedTool(request.toolKey)

  // Build prompt based on style
  const styleInstructions =
    request.style === 'strategist'
      ? `You are a strategic advisor. Your responses should be:
- Diagnostic and calm
- Prioritization-focused
- Include "what to stop doing" guidance
- Professional but approachable
- No hype, no fluff`
      : `You are a conversion-focused advisor. Your responses should be:
- Direct and action-forward
- Objection-aware
- Clear next steps
- Still ethical and human
- No manipulation tactics`

  // Base system prompt
  let systemPrompt = `You are an expert advisor helping creators build strategic engagement and convert conversations into revenue.

${styleInstructions}

Voice Guidelines:
${request.promptProfile.dos}

Avoid:
${request.promptProfile.donts}

Banned phrases: ${request.promptProfile.bannedPhrases.join(', ')}

Tone: ${request.promptProfile.toneNotes}

Safety Rules:
${request.rubric.safetyRules}

Reasoning Rules:
${request.rubric.reasoningRules}

Input Context:
${request.rubric.inputHints}

Output Schema (return valid JSON matching this structure):
${JSON.stringify(request.rubric.outputSchema, null, 2)}

Knowledge Base:
${knowledgeContext}`

  // Inject digital product master prompt for product-related tools
  if (isProductTool) {
    systemPrompt = `${DIGITAL_PRODUCT_MASTER_PROMPT}

---

${systemPrompt}`
  }

  const userPrompt = `Tool: ${request.toolKey}

User Inputs:
${JSON.stringify(request.inputs, null, 2)}

${userText ? `User-provided text:\n${userText}\n` : ''}

Generate a complete, strategic response based on the user inputs. You are generating the full output - not enhancing an existing result. Return a JSON object matching the output schema exactly. Include a brief "explanation" field (2-3 sentences) explaining your reasoning and approach.`

  try {
    const completion = await openaiClient.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    })

    const responseContent = completion.choices[0]?.message?.content
    if (!responseContent) {
      throw new Error('Empty AI response')
    }

    const parsed = JSON.parse(responseContent)
    const tokensIn = completion.usage?.prompt_tokens
    const tokensOut = completion.usage?.completion_tokens

    // Rough cost estimate (GPT-4 Turbo pricing as of 2024)
    // Input: $0.01 per 1K tokens, Output: $0.03 per 1K tokens
    const costEstimate =
      tokensIn && tokensOut
        ? (tokensIn / 1000) * 0.01 + (tokensOut / 1000) * 0.03
        : undefined

    return {
      enhancedOutput: parsed,
      explanation: parsed.explanation || 'Enhanced with strategic reasoning.',
      tokensIn,
      tokensOut,
      costEstimate,
    }
  } catch (error) {
    console.error('[AI] Enhancement error:', error)
    throw new Error(
      `AI enhancement failed: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

export async function logAiUsage(
  userId: string | null,
  toolKey: string,
  style: AiStyle | null,
  tokensIn?: number,
  tokensOut?: number,
  costEstimate?: number
): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId: userId || null,
        toolKey,
        style: style || null,
        tokensIn: tokensIn || null,
        tokensOut: tokensOut || null,
        costEstimate: costEstimate || null,
      },
    })
  } catch (error) {
    console.error('[AI] Logging error:', error)
    // Don't throw - logging failures shouldn't break the flow
  }
}

export function isAiEnabled(): boolean {
  return !!OPENAI_API_KEY && !!openaiClient
}
