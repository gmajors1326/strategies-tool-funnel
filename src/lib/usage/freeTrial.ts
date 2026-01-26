import { prisma } from '@/src/lib/prisma'

export const FREE_TRIAL_DAYS = 7

export type FreeTrialStatus = {
  active: boolean
  expired: boolean
  endsAt: Date | null
  daysRemaining: number
}

export async function getFreeTrialStatus(userId: string, planId?: string): Promise<FreeTrialStatus> {
  if (planId && planId !== 'free') {
    return { active: false, expired: false, endsAt: null, daysRemaining: 0 }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  })

  if (!user) {
    return { active: false, expired: false, endsAt: null, daysRemaining: 0 }
  }

  const endsAt = new Date(user.createdAt.getTime() + FREE_TRIAL_DAYS * 24 * 60 * 60 * 1000)
  const now = new Date()
  const active = now < endsAt
  const daysRemaining = Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))

  return {
    active,
    expired: !active,
    endsAt,
    daysRemaining,
  }
}
