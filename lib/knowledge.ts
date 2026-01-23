import { prisma } from './db'
import { Plan } from '@prisma/client'
import type { AiStyle } from './ai'
import { withCache } from './cache'

export interface KnowledgeRetrievalOptions {
  category?: string
  tags?: string[]
  toolKey?: string
  style?: AiStyle
  plan: Plan
  limit?: number
}

export async function retrieveKnowledge(
  options: KnowledgeRetrievalOptions
): Promise<string[]> {
  const limit = options.limit || 10
  const cacheKey = [
    'knowledge',
    options.plan,
    options.style || 'any',
    options.category || 'any',
    options.toolKey || 'any',
    (options.tags || []).join(',') || 'none',
    limit,
  ].join(':')

  return withCache(cacheKey, 300, async () => {

  // Build where clause
  const where: any = {}

  if (options.category) {
    where.category = options.category
  }

  if (options.tags && options.tags.length > 0) {
    where.tags = {
      hasSome: options.tags,
    }
  }

  // Plan requirement filter
  const planHierarchy: Record<Plan, string[]> = {
    [Plan.FREE]: ['free'],
    [Plan.DM_ENGINE]: ['free', 'dm_engine'],
    [Plan.THE_STRATEGY]: ['free', 'the_strategy'],
    [Plan.ALL_ACCESS]: ['free', 'dm_engine', 'the_strategy', 'all_access'],
  }

  where.planRequired = {
    in: planHierarchy[options.plan] || ['free'],
  }

  // Style filter
  if (options.style) {
    where.OR = [
      { style: 'both' },
      { style: options.style },
    ]
  }

    const items = await prisma.knowledgeItem.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      select: {
        content: true,
      },
    })

    return items.map((item: { content: string }) => item.content)
  }, 300)
}

export async function getPromptProfile(style: AiStyle): Promise<{
  dos: string
  donts: string
  bannedPhrases: string[]
  toneNotes: string
} | null> {
  const cacheKey = `prompt_profile:${style}`
  return withCache(cacheKey, 300, async () => {
    const profile = await prisma.promptProfile.findFirst({
      where: {
        style,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    if (!profile) {
      return null
    }

    return {
      dos: profile.dos,
      donts: profile.donts,
      bannedPhrases: profile.bannedPhrases,
      toneNotes: profile.toneNotes,
    }
  }, 300)
}

export async function getPromptRubric(toolKey: string): Promise<{
  inputHints: string
  outputSchema: Record<string, any>
  reasoningRules: string
  safetyRules: string
} | null> {
  const cacheKey = `prompt_rubric:${toolKey}`
  return withCache(cacheKey, 300, async () => {
    const rubric = await prisma.promptRubric.findUnique({
      where: {
        toolKey,
      },
    })

    if (!rubric) {
      return null
    }

    return {
      inputHints: rubric.inputHints,
      outputSchema: rubric.outputSchemaJson as Record<string, any>,
      reasoningRules: rubric.reasoningRules,
      safetyRules: rubric.safetyRules,
    }
  }, 300)
}
