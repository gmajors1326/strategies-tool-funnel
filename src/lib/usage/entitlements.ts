import { Prisma } from '@prisma/client'
import { prisma } from '@/src/lib/prisma'
import { getNextResetAt } from '@/src/lib/usage/reset'

export const getOrCreateEntitlement = async (userId: string) => {
  try {
    const existing = await prisma.entitlement.findUnique({ where: { user_id: userId } })
    if (existing) return existing
    const now = new Date()
    return prisma.entitlement.create({
      data: {
        user_id: userId,
        plan: 'free',
        resets_at: getNextResetAt(now),
      },
    })
  } catch (err) {
    console.error('[entitlements] getOrCreateEntitlement failed', (err as any)?.message || err)
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      const now = new Date()
      return {
        id: `entitlement_${userId}`,
        userId,
        plan: 'free',
        resetsAt: getNextResetAt(now),
        tokensCache: null,
        createdAt: now,
        updatedAt: now,
      }
    }
    throw err
  }
}
