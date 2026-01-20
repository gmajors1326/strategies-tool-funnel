import { getSession } from './auth'
import { getUserEntitlements } from './entitlements'
import { enhanceWithAi, logAiUsage, isAiEnabled, type AiStyle } from './ai'
import { retrieveKnowledge, getPromptProfile, getPromptRubric } from './knowledge'
import { prisma } from './db'
import { minimizeInputsForStorage } from './privacy'
import type { Prisma } from '@prisma/client'
import { Plan } from '@prisma/client'

export interface ToolExecutionOptions {
  toolKey: string
  inputs: Record<string, any>
  userText?: string // Optional user-provided text
  style?: AiStyle // strategist | closer
  save?: boolean
}

export interface ToolExecutionResult {
  outputs: Record<string, any>
  saved: boolean
  aiUsageRemaining?: number
}

export async function executeTool(
  options: ToolExecutionOptions
): Promise<ToolExecutionResult> {
  const {
    toolKey,
    inputs,
    userText,
    style,
    save = false,
  } = options

  // Check session and entitlements
  const session = await getSession()
  if (!session) {
    throw new Error('Authentication required to use tools')
  }

  const entitlements = await getUserEntitlements(session.userId)

  // Determine AI style based on tool and plan
  const aiStyle: AiStyle =
    style ||
    (toolKey.includes('dm') || toolKey.includes('opener') || toolKey.includes('intelligence')
      ? 'closer'
      : 'strategist')

  // AI is required - check if available and allowed
  if (!isAiEnabled()) {
    throw new Error('AI service is not configured. Please contact support.')
  }

  if (!entitlements.aiUsage.canUseAi) {
    throw new Error(
      `AI usage limit reached. You have ${entitlements.aiUsage.remaining} remaining calls today. Upgrade your plan for more AI calls.`
    )
  }

  // Retrieve knowledge and prompts
  const [knowledgeChunks, promptProfile, rubric] = await Promise.all([
    retrieveKnowledge({
      category: getCategoryForTool(toolKey),
      toolKey,
      style: aiStyle,
      plan: session.plan as Plan,
      limit: 10,
    }),
    getPromptProfile(aiStyle),
    getPromptRubric(toolKey),
  ])

  if (!promptProfile || !rubric) {
    throw new Error(`Missing prompt configuration for tool: ${toolKey}`)
  }

  // Execute with AI (required, no fallback)
  const aiResult = await enhanceWithAi({
    toolKey,
    inputs,
    // No deterministic output - AI generates everything from scratch
    userText: userText?.slice(0, 2000), // Enforce length limit
    style: aiStyle,
    knowledgeChunks,
    promptProfile,
    rubric: {
      inputHints: rubric.inputHints,
      outputSchema: rubric.outputSchema,
      reasoningRules: rubric.reasoningRules,
      safetyRules: rubric.safetyRules,
    },
  })

  // Use AI output directly
  const outputs = {
    ...aiResult.enhancedOutput,
    aiExplanation: aiResult.explanation,
  }

  // Log AI usage
  await logAiUsage(
    session.userId,
    toolKey,
    aiStyle,
    aiResult.tokensIn,
    aiResult.tokensOut,
    aiResult.costEstimate
  )

  // Update remaining usage
  const updatedEntitlements = await getUserEntitlements(session.userId)
  const aiUsageRemaining = updatedEntitlements.aiUsage.remaining

  // Save if requested and allowed
  let saved = false
  if (save && entitlements.canSaveRuns) {
    if (entitlements.freeRunsRemaining > 0 || entitlements.dmEngine || entitlements.strategy || entitlements.allAccess) {
      await prisma.toolRun.create({
        data: {
          userId: session.userId,
          toolKey,
          inputsJson: minimizeInputsForStorage(inputs) as unknown as Prisma.InputJsonValue,
          outputsJson: outputs as unknown as Prisma.InputJsonValue,
          saved: true,
        },
      })

      // Decrement free runs if not paid
      if (session.plan === 'FREE' && entitlements.freeRunsRemaining > 0) {
        await prisma.user.update({
          where: { id: session.userId },
          data: {
            freeVerifiedRunsRemaining: {
              decrement: 1,
            },
          },
        })
      }

      saved = true
    }
  }

  return {
    outputs,
    saved,
    aiUsageRemaining,
  }
}

function getCategoryForTool(toolKey: string): string {
  if (toolKey.includes('diagnostic') || toolKey.includes('engagement')) {
    return 'diagnostic'
  }
  if (toolKey.includes('dm') || toolKey.includes('opener') || toolKey.includes('intelligence')) {
    return 'dm'
  }
  if (toolKey.includes('hook')) {
    return 'voice'
  }
  return 'engagement'
}
