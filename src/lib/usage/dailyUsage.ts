import { prisma } from '@/src/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getNextResetAt, getWindowStart } from '@/src/lib/usage/reset'

export const ensureUsageWindow = async (userId: string) => {
  const now = new Date()
  const entitlement = await prisma.entitlement.findUnique({ where: { userId } })
  const resetsAt = entitlement?.resetsAt ?? getNextResetAt(now)

  if (!entitlement) {
    await prisma.entitlement.create({
      data: {
        userId,
        plan: 'free',
        resetsAt,
      },
    })
  }

  if (now >= resetsAt) {
    const newResetsAt = getNextResetAt(now)
    await prisma.entitlement.update({
      where: { userId },
      data: { resetsAt: newResetsAt },
    })
    const windowStart = getWindowStart(now)
    const windowEnd = newResetsAt
    return prisma.dailyUsage.upsert({
      where: { userId_windowEnd: { userId, windowEnd } },
      update: {},
      create: {
        userId,
        windowStart,
        windowEnd,
        aiTokensUsed: 0,
        runsUsed: 0,
        perToolRunsUsed: {},
        resetsAt: windowEnd,
      },
    })
  }

  const windowStart = getWindowStart(now)
  const windowEnd = resetsAt
  return prisma.dailyUsage.upsert({
    where: { userId_windowEnd: { userId, windowEnd } },
    update: {},
    create: {
      userId,
      windowStart,
      windowEnd,
      aiTokensUsed: 0,
      runsUsed: 0,
      perToolRunsUsed: {},
      resetsAt: windowEnd,
    },
  })
}

export const incrementUsageTx = async (params: {
  tx: Prisma.TransactionClient
  userId: string
  windowEnd: Date
  toolId: string
  tokensUsed: number
}) => {
  const { tx, userId, windowEnd, toolId, tokensUsed } = params
  const usage = await tx.dailyUsage.findUnique({
    where: { userId_windowEnd: { userId, windowEnd } },
  })
  if (!usage) return null

  const perTool = (usage.perToolRunsUsed as Record<string, number>) || {}
  perTool[toolId] = (perTool[toolId] || 0) + 1

  return tx.dailyUsage.update({
    where: { userId_windowEnd: { userId, windowEnd } },
    data: {
      aiTokensUsed: { increment: tokensUsed },
      runsUsed: { increment: 1 },
      perToolRunsUsed: perTool,
      updatedAt: new Date(),
    },
  })
}
