import { prisma } from '@/src/lib/prisma'

export type BonusRunConsumeResult =
  | { ok: true; consumedFromId: string }
  | { ok: false; reason: 'none_available' | 'expired' }

const buildEligibilityFilter = (toolId: string, now: Date) => ({
  AND: [
    { OR: [{ toolId }, { toolId: null }] },
    { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  ],
})

export async function getBonusRunsRemainingForTool(params: {
  userId: string
  toolId: string
  now?: Date
}): Promise<number> {
  const { userId, toolId, now = new Date() } = params

  const rows = await prisma.toolBonusRuns.findMany({
    where: {
      userId,
      ...buildEligibilityFilter(toolId, now),
    },
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
  })

  return rows.reduce((acc, r) => {
    const rem = Math.max(0, r.runsGranted - r.runsUsed)
    return acc + rem
  }, 0)
}

export async function getBonusRunGrantExists(params: {
  userId: string
  toolId: string
}): Promise<boolean> {
  const { userId, toolId } = params
  const count = await prisma.toolBonusRuns.count({
    where: { userId, toolId },
  })
  return count > 0
}

export async function getBonusRunsSummary(params: {
  userId: string
  toolId: string
  now?: Date
}): Promise<{ grantedRuns: number; usedRuns: number; remainingRuns: number; expiresAt: string | null }> {
  const { userId, toolId, now = new Date() } = params
  const rows = await prisma.toolBonusRuns.findMany({
    where: {
      userId,
      ...buildEligibilityFilter(toolId, now),
    },
    orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
  })

  let grantedRuns = 0
  let usedRuns = 0
  let expiresAt: string | null = null
  rows.forEach((row) => {
    grantedRuns += row.runsGranted
    usedRuns += row.runsUsed
    if (!expiresAt && row.expiresAt) {
      expiresAt = row.expiresAt.toISOString()
    }
  })

  const remainingRuns = Math.max(grantedRuns - usedRuns, 0)
  return { grantedRuns, usedRuns, remainingRuns, expiresAt }
}

export async function consumeOneBonusRun(params: {
  userId: string
  toolId: string
  now?: Date
}): Promise<BonusRunConsumeResult> {
  const { userId, toolId, now = new Date() } = params

  return await prisma.$transaction(async (tx) => {
    const rows = await tx.toolBonusRuns.findMany({
      where: {
        userId,
        ...buildEligibilityFilter(toolId, now),
      },
      orderBy: [{ expiresAt: 'asc' }, { createdAt: 'asc' }],
    })

    const eligible = rows.find((r) => r.runsUsed < r.runsGranted)
    if (!eligible) {
      return { ok: false as const, reason: 'none_available' }
    }

    const updated = await tx.toolBonusRuns.update({
      where: { id: eligible.id },
      data: { runsUsed: { increment: 1 } },
      select: { id: true, runsGranted: true, runsUsed: true },
    })

    if (updated.runsUsed > updated.runsGranted) {
      await tx.toolBonusRuns.update({
        where: { id: eligible.id },
        data: { runsUsed: { decrement: 1 } },
      })
      return { ok: false as const, reason: 'none_available' }
    }

    return { ok: true as const, consumedFromId: eligible.id }
  })
}

export async function grantBonusRuns(params: {
  userId: string
  toolId?: string | null
  runsGranted: number
  reason?: string
  expiresAt?: Date | null
  grantedBy?: string | null
}): Promise<{ id: string; userId: string; toolId: string | null; runsGranted: number; runsUsed: number }> {
  const { userId, toolId = null, runsGranted, reason, expiresAt = null, grantedBy = null } = params

  if (!Number.isInteger(runsGranted) || runsGranted <= 0) {
    throw new Error('runsGranted must be a positive integer.')
  }

  const row = await prisma.toolBonusRuns.create({
    data: {
      userId,
      toolId,
      runsGranted,
      runsUsed: 0,
      reason,
      expiresAt,
      grantedBy,
    },
    select: { id: true, userId: true, toolId: true, runsGranted: true, runsUsed: true },
  })

  return row
}
