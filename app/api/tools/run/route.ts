// app/api/tools/run/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getToolMeta } from '@/src/lib/tools/registry'
import { runnerRegistry } from '@/src/lib/tools/runnerRegistry'
import { addRun } from '@/src/lib/tools/runStore'
import { getBonusRunsRemainingForTool, consumeOneBonusRun } from '@/src/lib/tool/bonusRuns'
import { getTrialState, markTrialUsed } from '@/src/lib/tool/trialLedger'
import { ensureUsageWindow, incrementUsageTx } from '@/src/lib/usage/dailyUsage'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import type { RunRequest, RunResponse } from '@/src/lib/tools/runTypes'
import { buildLock } from '@/src/lib/tools/accessGate'
import { prisma } from '@/src/lib/prisma'
import { getActiveOrg, getMembership, logToolRun } from '@/src/lib/orgs/orgs'
import { requireUser } from '@/src/lib/auth/requireUser'
import { validateInput } from '@/src/lib/tools/validate'
import { assertDbReadyOnce, isProviderError, normalizePrismaError } from '@/src/lib/prisma/guards'

const requestSchema = z.object({
  toolId: z.string(),
  mode: z.enum(['paid', 'trial']),
  trialMode: z.enum(['sandbox', 'live', 'preview']).optional(),
  input: z.record(z.any()),
  runId: z.string().optional(),
  dryRun: z.boolean().optional(), // ✅ NEW
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()

  // ✅ NEW: requestId for tracing (also echoed in JSON)
  const requestId = crypto.randomUUID()

  await assertDbReadyOnce()

  const session = await requireUser()
  const userId = session.id

  const body = await request.json()
  const data = requestSchema.parse(body) as RunRequest & { dryRun?: boolean }

  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)

  let tool: ReturnType<typeof getToolMeta> | null = null
  try {
    tool = getToolMeta(data.toolId)
  } catch {
    tool = null
  }

  const activeOrg = await getActiveOrg(userId)
  const membership = activeOrg ? await getMembership(userId, activeOrg.id) : null
  const orgPlan = activeOrg?.plan as 'business' | 'enterprise' | undefined
  const orgPlanKey = getPlanKeyFromOrgPlan(orgPlan)

  const personalCaps = getPlanCaps(personalPlanKey)

  const planRunCap = orgPlanKey
    ? getPlanCaps(orgPlanKey).runsPerDay
    : orgPlan === 'enterprise'
      ? orgRunCapByPlan.enterprise
      : personalCaps.runsPerDay

  const planTokenCap = orgPlanKey
    ? getPlanCaps(orgPlanKey).tokensPerDay
    : orgPlan === 'enterprise'
      ? orgAiTokenCapByPlan.enterprise
      : personalCaps.tokensPerDay

  const runId = data.runId || crypto.randomUUID()

  const summarizeValue = (value: unknown, limit = 180) => {
    try {
      if (typeof value === 'string') return value.slice(0, limit)
      const json = JSON.stringify(value)
      return json.length > limit ? `${json.slice(0, limit)}…` : json
    } catch {
      return ''
    }
  }

  const sanitizeInputPayload = (value: unknown): unknown => {
    const sensitiveKeys = ['token', 'secret', 'password', 'apiKey', 'apikey', 'authorization', 'cookie']
    if (Array.isArray(value)) {
      return value.map((item) => sanitizeInputPayload(item))
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>).map(([key, val]) => {
          const lower = key.toLowerCase()
          if (sensitiveKeys.some((k) => lower.includes(k))) {
            return [key, '[redacted]']
          }
          return [key, sanitizeInputPayload(val)]
        })
      )
    }
    return value
  }

  const inputSummary = summarizeValue(data.input)

  const recordRun = async (params: {
    status: 'ok' | 'locked' | 'error'
    lockCode?: string | null
    meteringMode?: string
    tokensCharged?: number
    errorCode?: string | null
    outputSummary?: string | null
  }) => {
    await logToolRun({
      orgId: activeOrg?.id,
      userId,
      toolId: data.toolId,
      runId,
      meteringMode: params.meteringMode || 'tokens',
      tokensCharged: params.tokensCharged || 0,
      status: params.status,
      lockCode: params.lockCode || null,
      durationMs: Date.now() - startedAt,
      inputSummary,
      outputSummary: params.outputSummary || null,
      errorCode: params.errorCode || null,
    })
  }

  const logProductEvent = async (eventName: string, meta: Record<string, any>) => {
    try {
      await prisma.productEvent.create({
        data: {
          userId,
          eventName,
          metaJson: meta,
        },
      })
    } catch {
      // ignore
    }
  }

  // Helper to return JSON with requestId header consistently
  const jsonWithRequestId = (payload: any, init?: Parameters<typeof NextResponse.json>[1]) => {
    const res = NextResponse.json(payload, init)
    res.headers.set('x-request-id', requestId)
    return res
  }

  if (!tool) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_plan' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Tool not found.',
          cta: { type: 'contact', href: '/app/support' },
        }),
        // ✅ NEW: inputEcho
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 404 }
    )
  }

  if (membership?.role === 'viewer') {
    await recordRun({ status: 'locked', lockCode: 'locked_role', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_role' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_role',
          message: 'Viewer seats cannot run tools.',
          cta: { type: 'upgrade', href: activeOrg ? `/orgs/${activeOrg.slug}/members` : '/pricing' },
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  // Idempotency: if a runId was provided and already exists in ledger, reject
  if (data.runId) {
    const existing = await prisma.tokenLedger.findFirst({ where: { run_id: data.runId } })
    if (existing) {
      await recordRun({ status: 'error', lockCode: 'duplicate', errorCode: 'DUPLICATE_RUN' })
      return jsonWithRequestId(
        { status: 'error', error: { message: 'Duplicate run_id; request already processed.', code: 'DUPLICATE_RUN' }, requestId },
        { status: 409 }
      )
    }
  }

  const validation = validateInput(data.toolId, data.input)
  if (!validation.valid) {
    await recordRun({ status: 'error', lockCode: 'validation', errorCode: 'VALIDATION_ERROR' })
    return jsonWithRequestId(
      {
        status: 'error',
        error: {
          message: validation.errors?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.errors?.details,
        },
        // ✅ NEW: inputEcho
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 400 }
    )
  }

  if (!tool.enabled) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_plan' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Tool is offline.',
          cta: { type: 'contact', href: '/app/support' },
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  if (personalPlan === 'free' && (tool.category === 'Analytics' || tool.category === 'Competitive')) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_plan' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Analytics and Competitive tools require Pro+.',
          cta: { type: 'upgrade', href: '/pricing' },
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  const toolCapForPlan = tool.dailyRunsByPlan?.[personalPlan] ?? 0

  if (data.mode === 'paid' && toolCapForPlan <= 0) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_plan' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Tool requires purchase.',
          cta: { type: 'upgrade', href: '/pricing' },
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  const usage = await ensureUsageWindow(userId)
  const toolCap = data.mode === 'trial' && toolCapForPlan <= 0 ? 1 : toolCapForPlan || planRunCap
  const toolRunsUsed = (usage.per_tool_runs_used as Record<string, number>)?.[tool.id] ?? 0

  if (usage.runs_used >= planRunCap) {
    await recordRun({ status: 'locked', lockCode: 'locked_usage_daily', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_usage_daily' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_usage_daily',
          message: 'Daily run cap reached.',
          cta: { type: 'wait_reset', href: '/app/usage' },
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
          },
          resetsAtISO: usage.resets_at.toISOString(),
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  // NOTE: If your ToolMeta doesn't have aiLevel, consider adding it.
  if (usage.ai_tokens_used >= planTokenCap && (tool as any).aiLevel !== 'none') {
    await recordRun({ status: 'locked', lockCode: 'locked_tokens', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_tokens' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_tokens',
          message: 'Daily token cap reached.',
          cta: { type: 'buy_tokens', href: '/pricing' },
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
          },
          resetsAtISO: usage.resets_at.toISOString(),
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  if (toolRunsUsed >= toolCap) {
    await recordRun({ status: 'locked', lockCode: 'locked_tool_daily', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_tool_daily' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_tool_daily',
          message: 'Daily tool cap reached.',
          cta: { type: 'wait_reset', href: '/app/usage' },
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
          },
          resetsAtISO: usage.resets_at.toISOString(),
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  const trial = getTrialState(userId, tool.id)
  const bonusRemaining = await getBonusRunsRemainingForTool({ userId, toolId: tool.id })

  if (data.mode === 'trial' && !trial.allowed && bonusRemaining <= 0) {
    await recordRun({ status: 'locked', lockCode: 'locked_trial', meteringMode: 'trial', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_trial' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_trial',
          message: 'Trial used.',
          cta: { type: 'upgrade', href: '/pricing' },
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  const tokenBalance = await getTokenBalance(userId)
  const requiredTokens = tool.tokensPerRun

  const meteringMode =
    bonusRemaining > 0 && data.mode !== 'trial' ? 'bonus_run' : data.mode === 'trial' ? 'trial' : 'tokens'

  if (meteringMode === 'tokens' && tokenBalance < requiredTokens) {
    await recordRun({ status: 'locked', lockCode: 'locked_tokens', meteringMode: 'tokens', errorCode: 'LOCKED' })
    await logProductEvent('tool_run_locked', { toolId: data.toolId, lock: 'locked_tokens' })
    return jsonWithRequestId(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_tokens',
          message: 'Not enough tokens.',
          cta: { type: 'buy_tokens', href: '/pricing' },
          requiredTokens,
          remainingTokens: tokenBalance,
        }),
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 403 }
    )
  }

  const runner = runnerRegistry[data.toolId]
  if (!runner) {
    await recordRun({ status: 'error', lockCode: 'tool_error', errorCode: 'TOOL_ERROR' })
    return jsonWithRequestId(
      {
        status: 'error',
        error: { message: 'Runner not implemented.', code: 'TOOL_ERROR' },
        inputEcho: data.input ?? {},
        requestId,
      },
      { status: 500 }
    )
  }

  // ✅ NEW: DRY RUN SUPPORT
  // Return lock/validation/token status WITHOUT executing AI and WITHOUT charging tokens/usage.
  if (data.dryRun) {
    await recordRun({ status: 'ok', meteringMode: 'dry_run', tokensCharged: 0 })

    return jsonWithRequestId({
      status: 'ok',
      output: {
        dryRun: true,
        estimatedTokens: requiredTokens,
        meteringMode,
        planRunCap,
        planTokenCap,
        toolCap,
        toolRunsUsed,
        runsUsed: usage.runs_used,
        aiTokensUsed: usage.ai_tokens_used,
        remainingTokens: tokenBalance,
        remainingBonusRuns: bonusRemaining,
        trialAllowed: trial.allowed,
      },
      inputEcho: data.input ?? {},
      runId,
      metering: {
        chargedTokens: 0,
        remainingTokens: tokenBalance,
        aiTokensUsed: usage.ai_tokens_used,
        aiTokensCap: planTokenCap,
        runsUsed: usage.runs_used,
        runsCap: planRunCap,
        resetsAtISO: usage.resets_at.toISOString(),
        meteringMode,
        remainingBonusRuns: bonusRemaining,
        orgId: activeOrg?.id ?? null,
      },
      requestId,
    })
  }

  try {
    const output = await runner(data, {
      user: { id: userId, planId: personalPlan },
      toolMeta: tool,
      usage: { aiTokensRemaining: tokenBalance },
      logger: { info: () => undefined, error: () => undefined },
    })

    if (data.mode === 'trial' && trial.allowed) {
      markTrialUsed(userId, tool.id)
    }

    let remainingBonusRuns = bonusRemaining
    let chargedTokens = 0

    await prisma.$transaction(async (tx) => {
      if (meteringMode === 'bonus_run') {
        const consumed = await consumeOneBonusRun({ userId, toolId: tool.id })
        remainingBonusRuns = consumed.ok
          ? await getBonusRunsRemainingForTool({ userId, toolId: tool.id })
          : bonusRemaining
      }

      if (meteringMode === 'tokens') {
        await tx.tokenLedger.create({
          data: {
            user_id: userId,
            event_type: 'spend_tool',
            tokens_delta: -requiredTokens,
            tool_id: tool.id,
            run_id: runId,
            reason: 'tool_run',
          },
        })
        chargedTokens = requiredTokens
      }

      await incrementUsageTx({
        tx,
        userId,
        windowEnd: usage.window_end,
        toolId: tool.id,
        tokensUsed: meteringMode === 'tokens' ? requiredTokens : 0,
      })
    })

    const updatedBalance = await getTokenBalance(userId)

    const response: RunResponse & { inputEcho?: any; requestId?: string; usage?: any } = {
      status: 'ok',
      output: output.output,
      runId,
      metering: {
        chargedTokens,
        remainingTokens: updatedBalance,
        aiTokensUsed: usage.ai_tokens_used + (meteringMode === 'tokens' ? requiredTokens : 0),
        aiTokensCap: planTokenCap,
        runsUsed: usage.runs_used + 1,
        runsCap: planRunCap,
        resetsAtISO: usage.resets_at.toISOString(),
        meteringMode,
        remainingBonusRuns,
        orgId: activeOrg?.id ?? null,
      },
      // ✅ NEW: inputEcho
      inputEcho: data.input ?? {},
      requestId,
      usage: (output as any).usage ?? undefined,
    }

    // Persist recent runs (DB-backed now)
    await addRun(userId, tool.id, runId, response)

    try {
      const sanitizedInput = sanitizeInputPayload(data.input ?? {})
      await prisma.toolRun.create({
        data: {
          id: runId,
          userId,
          toolId: tool.id,
          toolSlug: tool.id,
          toolKey: tool.id,
          input: sanitizedInput,
          output: output.output ?? {},
          inputsJson: sanitizedInput,
          outputsJson: output.output ?? {},
        },
      })
    } catch (err: any) {
      if (err?.code !== 'P2002' && err?.code !== 'P2021') {
        throw err
      }
    }

    await recordRun({
      status: 'ok',
      meteringMode,
      tokensCharged: chargedTokens,
      lockCode: null,
      outputSummary: summarizeValue(output.output),
    })

    return jsonWithRequestId(response)
  } catch (err: any) {
    const normalized = isProviderError(err) ? err : normalizePrismaError(err)

    await recordRun({ status: 'error', lockCode: 'tool_error', errorCode: normalized.code || 'PROVIDER_ERROR' })

    return NextResponse.json<RunResponse>(
      {
        status: 'error',
        error: {
          message: normalized.message,
          code: 'PROVIDER_ERROR',
          details: normalized.details,
        },
      },
      { status: 503, headers: { 'x-request-id': requestId } }
    )
  }
}
