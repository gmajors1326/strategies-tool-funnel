import { prisma } from '@/src/lib/prisma'
import type { Prisma } from '@prisma/client'
import { getNextResetAt, getWindowStart } from '@/src/lib/usage/reset'

export const ensureUsageWindow = async (userId: string) => {
  const now = new Date()
  const entitlement = await prisma.entitlement.findUnique({ where: { user_id: userId } })
  const resetsAt = entitlement?.resets_at ?? getNextResetAt(now)

  if (!entitlement) {
    await prisma.entitlement.create({
      data: {
        user_id: userId,
        plan: 'free',
        resets_at: resetsAt,
      },
    })
  }

  if (now >= resetsAt) {
    const newResetsAt = getNextResetAt(now)
    await prisma.entitlement.update({
      where: { user_id: userId },
      data: { resets_at: newResetsAt },
    })
    const windowStart = getWindowStart(now)
    const windowEnd = newResetsAt
    return prisma.dailyUsage.upsert({
      where: { user_id_window_end: { user_id: userId, window_end: windowEnd } },
      update: {},
      create: {
        user_id: userId,
        window_start: windowStart,
        window_end: windowEnd,
        ai_tokens_used: 0,
        runs_used: 0,
        per_tool_runs_used: {},
        resets_at: windowEnd,
      },
    })
  }

  const windowStart = getWindowStart(now)
  const windowEnd = resetsAt
  return prisma.dailyUsage.upsert({
    where: { DailyUsage_user_window_end_uidx: { user_id: userId, window_end: windowEnd } },
    update: {},
    create: {
      user_id: userId,
      window_start: windowStart,
      window_end: windowEnd,
      ai_tokens_used: 0,
      runs_used: 0,
      per_tool_runs_used: {},
      resets_at: windowEnd,
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
    where: { DailyUsage_user_window_end_uidx: { user_id: userId, window_end: windowEnd } },
  })
  if (!usage) return null

  const perTool = (usage.per_tool_runs_used as Record<string, number>) || {}
  perTool[toolId] = (perTool[toolId] || 0) + 1

  return tx.dailyUsage.update({
    where: { DailyUsage_user_window_end_uidx: { user_id: userId, window_end: windowEnd } },
    data: {
      ai_tokens_used: { increment: tokensUsed },
      runs_used: { increment: 1 },
      per_tool_runs_used: perTool,
      updated_at: new Date(),
    },
  })
}
