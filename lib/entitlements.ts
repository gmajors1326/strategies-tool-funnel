import { prisma } from './db'
import { Plan } from '@prisma/client'
import { checkAiUsageLimit } from './ai-usage'

export interface Entitlements {
  dmEngine: boolean
  strategy: boolean
  allAccess: boolean
  canUseFreeTools: boolean
  canSaveRuns: boolean
  canExportPDF: boolean
  freeRunsRemaining: number
  aiUsage: {
    canUseAi: boolean
    dailyLimit: number
    usedToday: number
    remaining: number
  }
}

export async function getUserEntitlements(userId: string): Promise<Entitlements> {
  const [user, entitlements] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true, freeVerifiedRunsRemaining: true, emailVerifiedAt: true },
    }),
    prisma.planEntitlement.findUnique({
      where: { userId },
    }),
  ])

  if (!user) {
    return {
      dmEngine: false,
      strategy: false,
      allAccess: false,
      canUseFreeTools: false,
      canSaveRuns: false,
      canExportPDF: false,
      freeRunsRemaining: 0,
      aiUsage: {
        canUseAi: false,
        dailyLimit: 0,
        usedToday: 0,
        remaining: 0,
      },
    }
  }

  const plan = user.plan
  const hasAllAccess = plan === Plan.ALL_ACCESS || entitlements?.allAccess === true
  const hasDMEngine = plan === Plan.DM_ENGINE || entitlements?.dmEngine === true || hasAllAccess
  const hasStrategy = plan === Plan.THE_STRATEGY || entitlements?.strategy === true || hasAllAccess

  // Check AI usage limits
  const aiUsage = await checkAiUsageLimit(userId, plan, user.emailVerifiedAt)

  return {
    dmEngine: hasDMEngine,
    strategy: hasStrategy,
    allAccess: hasAllAccess,
    canUseFreeTools: true, // Everyone can use free tools
    canSaveRuns: user.emailVerifiedAt !== null && (hasDMEngine || hasStrategy || hasAllAccess || user.freeVerifiedRunsRemaining > 0),
    canExportPDF: hasStrategy || hasAllAccess,
    freeRunsRemaining: user.freeVerifiedRunsRemaining,
    aiUsage,
  }
}

export async function grantEntitlement(userId: string, plan: Plan): Promise<void> {
  await prisma.planEntitlement.upsert({
    where: { userId },
    create: {
      userId,
      dmEngine: plan === Plan.DM_ENGINE || plan === Plan.ALL_ACCESS,
      strategy: plan === Plan.THE_STRATEGY || plan === Plan.ALL_ACCESS,
      allAccess: plan === Plan.ALL_ACCESS,
    },
    update: {
      dmEngine: plan === Plan.DM_ENGINE || plan === Plan.ALL_ACCESS,
      strategy: plan === Plan.THE_STRATEGY || plan === Plan.ALL_ACCESS,
      allAccess: plan === Plan.ALL_ACCESS,
    },
  })

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  })
}
