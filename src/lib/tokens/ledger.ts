import { prisma } from '@/src/lib/prisma'

export const getTokenBalance = async (userId: string) => {
  const sum = await prisma.tokenLedger.aggregate({
    where: { user_id: userId },
    _sum: { tokens_delta: true },
  })
  return sum._sum.tokens_delta ?? 0
}

export const listLedgerEntries = async (userId: string, limit = 50) => {
  return prisma.tokenLedger.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
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
      user_id: userId,
      event_type: eventType,
      tokens_delta: tokensDelta,
      tool_id: toolId ?? null,
      run_id: runId ?? null,
      reason: reason ?? null,
    },
  })
}
