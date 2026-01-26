import { prisma } from './db'
import { Plan } from '@/src/generated/prisma/client'

// Daily AI usage caps by plan
export const AI_USAGE_CAPS: Record<Plan, number> = {
  FREE: 0, // Anonymous users cannot use AI
  DM_ENGINE: 20, // Moderate cap for DM-focused users
  THE_STRATEGY: 30, // Higher cap for strategy users
  ALL_ACCESS: 50, // Highest cap for all-access users
}

// Verified free users get a small preview
export const VERIFIED_FREE_AI_CAP = 3

export interface AiUsageStatus {
  canUseAi: boolean
  dailyLimit: number
  usedToday: number
  remaining: number
}

export async function checkAiUsageLimit(
  userId: string,
  plan: Plan,
  emailVerifiedAt: Date | null
): Promise<AiUsageStatus> {
  // Anonymous users cannot use AI
  if (!userId || plan === Plan.FREE) {
    if (!emailVerifiedAt) {
      return {
        canUseAi: false,
        dailyLimit: 0,
        usedToday: 0,
        remaining: 0,
      }
    }
    // Verified free users get a small preview
    const usedToday = await getTodayAiUsageCount(userId)
    const dailyLimit = VERIFIED_FREE_AI_CAP
    return {
      canUseAi: usedToday < dailyLimit,
      dailyLimit,
      usedToday,
      remaining: Math.max(0, dailyLimit - usedToday),
    }
  }

  // Paid users have plan-based caps
  const dailyLimit = AI_USAGE_CAPS[plan] || 0
  const usedToday = await getTodayAiUsageCount(userId)

  return {
    canUseAi: usedToday < dailyLimit,
    dailyLimit,
    usedToday,
    remaining: Math.max(0, dailyLimit - usedToday),
  }
}

async function getTodayAiUsageCount(userId: string): Promise<number> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const count = await prisma.aiUsageLog.count({
    where: {
      userId,
      createdAt: {
        gte: startOfDay,
      },
    },
  })

  return count
}
