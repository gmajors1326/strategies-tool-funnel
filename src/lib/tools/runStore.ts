// src/lib/tools/runStore.ts
import type { RunResponse } from '@/src/lib/tools/runTypes'
import { prisma } from '@/src/lib/prisma'

const MAX_RUNS = 20

// DEV-only fallback (kept intentionally for local until Prisma schema is confirmed)
const devFallbackRunsByUser = new Map<string, RunResponse[]>()

function canUseDevFallback() {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true'
}

export const addRun = async (userId: string, toolId: string, runId: string, run: RunResponse) => {
  if ((prisma as any)?.toolRunLog?.create) {
    // Persist to DB
    try {
      await prisma.toolRunLog.create({
        data: {
          userId,
          toolId,
          runId,
          status: run.status,
          meteringMode: run.metering?.meteringMode ?? 'tokens',
          tokensCharged: run.metering?.chargedTokens ?? 0,
          lockCode: run.lock?.code ?? null,
          durationMs: null,
          orgId: run.metering?.orgId ?? null,
        },
      })
    } catch (err) {
      if (err instanceof Error && (err as any).code === 'P2021') {
        return
      }
      throw err
    }

    return
  }

  // No Prisma / model not ready
  if (canUseDevFallback()) {
    const existing = devFallbackRunsByUser.get(userId) ?? []
    const updated = [run, ...existing].slice(0, MAX_RUNS)
    devFallbackRunsByUser.set(userId, updated)
    return
  }

  throw new Error(
    [
      'runStore: persistence not configured.',
      '',
      'Expected Prisma model ToolRunLog (prisma.toolRunLog) to exist.',
      'In dev you may temporarily enable fallback by setting:',
      '  DEV_AUTH_BYPASS=true',
      '',
      'But production must use DB persistence.',
    ].join('\n')
  )
}

export const getRecentRuns = async (userId: string): Promise<RunResponse[]> => {
  if ((prisma as any)?.toolRunLog?.findMany) {
    try {
      const rows = await prisma.toolRunLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: MAX_RUNS,
      })

      // Map DB rows back into the RunResponse shape your UI expects.
      // Keep this minimal; full fidelity should come from your tool run logs + outputs store (later).
      return rows.map((r: any) => ({
        runId: r.runId,
        status: r.status,
        lock: r.lockCode
          ? { code: r.lockCode, message: '', cta: { type: 'upgrade' as const } }
          : undefined,
      })) as RunResponse[]
    } catch (err) {
      if (err instanceof Error && (err as any).code === 'P2021') {
        return []
      }
      throw err
    }
  }

  // No Prisma / model not ready
  if (canUseDevFallback()) {
    return devFallbackRunsByUser.get(userId) ?? []
  }

  throw new Error(
    [
      'runStore: persistence not configured.',
      '',
      'Expected Prisma model ToolRunLog (prisma.toolRunLog) to exist.',
      'In dev you may temporarily enable fallback by setting:',
      '  DEV_AUTH_BYPASS=true',
      '',
      'But production must use DB persistence.',
    ].join('\n')
  )
}
