import { prisma } from '@/src/lib/prisma'

export type BonusRunConsumeResult =
  | { ok: true; consumedFromId: string }
  | { ok: false; reason: 'none_available' | 'expired' }

const buildEligibilityFilter = (toolId: string, now: Date) => ({
  AND: [
    { OR: [{ tool_id: toolId }, { tool_id: null }] },
    { OR: [{ expires_at: null }, { expires_at: { gt: now } }] },
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
      user_id: userId,
      ...buildEligibilityFilter(toolId, now),
    },
    orderBy: [{ expires_at: 'asc' }, { created_at: 'asc' }],
  })

  return rows.reduce((acc, r) => {
    const rem = Math.max(0, r.runs_granted - r.runs_used)
    return acc + rem
  }, 0)
}

export async function getBonusRunGrantExists(params: {
  userId: string
  toolId: string
}): Promise<boolean> {
  const { userId, toolId } = params
  const count = await prisma.toolBonusRuns.count({
    where: { user_id: userId, tool_id: toolId },
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
      user_id: userId,
      ...buildEligibilityFilter(toolId, now),
    },
    orderBy: [{ expires_at: 'asc' }, { created_at: 'asc' }],
  })

  let grantedRuns = 0
  let usedRuns = 0
  let expiresAt: string | null = null
  rows.forEach((row) => {
    grantedRuns += row.runs_granted
    usedRuns += row.runs_used
    if (!expiresAt && row.expires_at) {
      expiresAt = row.expires_at.toISOString()
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
        user_id: userId,
        ...buildEligibilityFilter(toolId, now),
      },
      orderBy: [{ expires_at: 'asc' }, { created_at: 'asc' }],
    })

    const eligible = rows.find((r) => r.runs_used < r.runs_granted)
    if (!eligible) {
      return { ok: false as const, reason: 'none_available' }
    }

    const updated = await tx.toolBonusRuns.update({
      where: { id: eligible.id },
      data: { runs_used: { increment: 1 } },
      select: { id: true, runs_granted: true, runs_used: true },
    })

    if (updated.runs_used > updated.runs_granted) {
      await tx.toolBonusRuns.update({
        where: { id: eligible.id },
        data: { runs_used: { decrement: 1 } },
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
}): Promise<{ id: string; user_id: string; tool_id: string | null; runs_granted: number; runs_used: number }> {
  const { userId, toolId = null, runsGranted, reason, expiresAt = null, grantedBy = null } = params

  if (!Number.isInteger(runsGranted) || runsGranted <= 0) {
    throw new Error('runsGranted must be a positive integer.')
  }

  const row = await prisma.toolBonusRuns.create({
    data: {
      user_id: userId,
      tool_id: toolId,
      runs_granted: runsGranted,
      runs_used: 0,
      reason,
      expires_at: expiresAt,
      granted_by: grantedBy,
    },
    select: { id: true, user_id: true, tool_id: true, runs_granted: true, runs_used: true },
  })

  return row
}
