import { prisma } from '@/src/lib/prisma'
import { getNextResetAt } from '@/src/lib/usage/reset'

export const getOrCreateEntitlement = async (userId: string) => {
  const existing = await prisma.entitlement.findUnique({ where: { userId } })
  if (existing) return existing
  const now = new Date()
  return prisma.entitlement.create({
    data: {
      userId,
      plan: 'free',
      resetsAt: getNextResetAt(now),
    },
  })
}
