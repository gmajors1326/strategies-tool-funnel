// src/lib/tools/runStore.ts
import type { RunResponse } from '@/src/lib/tools/runTypes'

const MAX_RUNS = 20

// DEV-only fallback (kept intentionally for local until Prisma schema is confirmed)
const devFallbackRunsByUser = new Map<string, RunResponse[]>()

function canUseDevFallback() {
  return process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true'
}

/**
 * Attempts to load Prisma client at runtime without hard-importing a module path.
 * This avoids compile-time failure if your prisma client file path differs.
 *
 * Expected: prisma client export at one of:
 * - '@/src/lib/prisma'
 * - '@/lib/prisma'
 * - 'src/lib/prisma'
 *
 * And prisma model accessor: prisma.toolRunLog
 */
function getPrismaClient(): any | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod =
      require('@/src/lib/prisma') ||
      require('@/lib/prisma') ||
      require('src/lib/prisma')

    // Common patterns: default export, named export, or direct client
    return mod?.prisma || mod?.default || mod
  } catch {
    return null
  }
}

export const addRun = async (userId: string, run: RunResponse) => {
  const prisma = getPrismaClient()

  if (prisma?.toolRunLog?.create) {
    // Persist to DB
    await prisma.toolRunLog.create({
      data: {
        userId,
        toolId: run.toolId,
        runId: run.runId,
        status: run.status,
        meteringMode: run.metering?.meteringMode ?? 'tokens',
        tokensCharged: run.metering?.chargedTokens ?? 0,
        lockCode: run.lock?.code ?? null,
        durationMs: run.meta?.durationMs ?? null,
        // orgId can be added later when org context is wired into RunResponse
        orgId: run.meta?.orgId ?? null,
      },
    })

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
  const prisma = getPrismaClient()

  if (prisma?.toolRunLog?.findMany) {
    const rows = await prisma.toolRunLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: MAX_RUNS,
    })

    // Map DB rows back into the RunResponse shape your UI expects.
    // Keep this minimal; full fidelity should come from your tool run logs + outputs store (later).
    return rows.map((r: any) => ({
      toolId: r.toolId,
      runId: r.runId,
      status: r.status,
      lock: r.lockCode
        ? { code: r.lockCode, message: '', cta: { type: 'upgrade' as const } }
        : undefined,
      metering: {
        meteringMode: r.meteringMode,
        chargedTokens: r.tokensCharged ?? 0,
      },
      meta: {
        durationMs: r.durationMs ?? undefined,
        orgId: r.orgId ?? undefined,
      },
    })) as RunResponse[]
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
