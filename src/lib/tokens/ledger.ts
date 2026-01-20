import { prisma } from '@/src/lib/prisma'

export const getTokenBalance = async (userId: string) => {
  const sum = await prisma.tokenLedger.aggregate({
    where: { userId },
    _sum: { tokensDelta: true },
  })
  return sum._sum.tokensDelta ?? 0
}

export const listLedgerEntries = async (userId: string, limit = 50) => {
  return prisma.tokenLedger.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 200)),
  })
}

export const createLedgerEntry = async (params: {
  userId: string
  eventType: string
  tokensDelta: number
  toolId?: string | null
  runId?: string | null
  reason?: string | null
}) => {
  const { userId, eventType, tokensDelta, toolId, runId, reason } = params
  return prisma.tokenLedger.create({
    data: {
      userId,
      eventType,
      tokensDelta,
      toolId: toolId ?? null,
      runId: runId ?? null,
      reason: reason ?? null,
    },
  })
}
