import { getSession } from './auth'
import { getUserEntitlements } from './entitlements'
import { enhanceWithAi, logAiUsage, isAiEnabled, type AiStyle } from './ai'
import { retrieveKnowledge, getPromptProfile, getPromptRubric } from './knowledge'
import { prisma } from './db'
import type { Prisma } from '@prisma/client'
import { Plan } from '@prisma/client'

export interface ToolExecutionOptions {
  toolKey: string
  inputs: Record<string, any>
  deterministicOutput: Record<string, any>
  deterministicFn: (inputs: any) => Record<string, any>
  userText?: string // Optional user-provided text
  style?: AiStyle // strategist | closer
  save?: boolean
}

export interface ToolExecutionResult {
  outputs: Record<string, any>
  enhanced: boolean
  saved: boolean
  aiUsageRemaining?: number
}

export async function executeTool(
  options: ToolExecutionOptions
): Promise<ToolExecutionResult> {
  const {
    toolKey,
    inputs,
    deterministicOutput,
    deterministicFn,
    userText,
    style,
    save = false,
  } = options

  // Always run deterministic logic first
  let baseOutput = deterministicOutput || deterministicFn(inputs)

  // Check session and entitlements
  const session = await getSession()
  let enhanced = false
  let saved = false
  let aiUsageRemaining: number | undefined

  if (session) {
    const entitlements = await getUserEntitlements(session.userId)

    // Determine AI style based on tool and plan
    const aiStyle: AiStyle | null =
      style ||
      (toolKey.includes('dm') || toolKey.includes('opener')
        ? 'closer'
        : 'strategist')

    // Check if AI enhancement is available and allowed
    const canEnhance =
      isAiEnabled() &&
      entitlements.aiUsage.canUseAi &&
      aiStyle !== null

    if (canEnhance) {
      try {
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

        if (promptProfile && rubric) {
          // Enhance with AI
          const enhancement = await enhanceWithAi({
            toolKey,
            inputs,
            deterministicOutput: baseOutput,
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

          // Merge AI enhancement with deterministic output
          baseOutput = {
            ...baseOutput,
            ...enhancement.enhancedOutput,
            aiExplanation: enhancement.explanation,
          }

          // Log AI usage
          await logAiUsage(
            session.userId,
            toolKey,
            aiStyle,
            enhancement.tokensIn,
            enhancement.tokensOut,
            enhancement.costEstimate
          )

          // Update remaining usage
          const updatedEntitlements = await getUserEntitlements(session.userId)
          aiUsageRemaining = updatedEntitlements.aiUsage.remaining

          enhanced = true
        }
      } catch (error) {
        console.error(`[Tool Execution] AI enhancement failed for ${toolKey}:`, error)
        // Continue with deterministic output if AI fails
      }
    }

    // Save if requested and allowed
    if (save && entitlements.canSaveRuns) {
      if (entitlements.freeRunsRemaining > 0 || entitlements.dmEngine || entitlements.strategy || entitlements.allAccess) {
        await prisma.toolRun.create({
          data: {
            userId: session.userId,
            toolKey,
            inputsJson: inputs as unknown as Prisma.InputJsonValue,
            outputsJson: baseOutput as unknown as Prisma.InputJsonValue,
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
  }

  return {
    outputs: baseOutput,
    enhanced,
    saved,
    aiUsageRemaining,
  }
}

function getCategoryForTool(toolKey: string): string {
  if (toolKey.includes('diagnostic') || toolKey.includes('engagement')) {
    return 'diagnostic'
  }
  if (toolKey.includes('dm') || toolKey.includes('opener')) {
    return 'dm'
  }
  if (toolKey.includes('hook')) {
    return 'voice'
  }
  return 'engagement'
}
