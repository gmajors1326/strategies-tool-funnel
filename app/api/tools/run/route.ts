// app/api/tools/run/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'
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
import { dbHealthCheck } from '@/src/lib/db/dbHealth'

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

  let body: unknown
  let data: (RunRequest & { dryRun?: boolean }) | null = null
  try {
    body = await request.json()
    data = requestSchema.parse(body) as RunRequest & { dryRun?: boolean }
  } catch (err: any) {
    console.info('[tools/run] invalid_request', { requestId, error: err?.message || 'Invalid payload' })
    return NextResponse.json<RunResponse>(
      {
        status: 'error',
        error: { message: 'Invalid request payload.', code: 'VALIDATION_ERROR' },
        requestId,
      },
      { status: 400, headers: { 'x-request-id': requestId } }
    )
  }
  const runId = data.runId || crypto.randomUUID()

  const log = (message: string, meta?: Record<string, any>) => {
    console.info('[tools/run]', {
      requestId,
      toolId: data?.toolId,
      ...meta,
      message,
    })
  }

  log('request_start', { dryRun: data.dryRun ?? false })

  const leadCaptured = request.cookies.get('leadCaptured')?.value === 'true'
  const dbHealth = await dbHealthCheck()
  let degraded = !dbHealth.ok
  log('db_health', { ok: dbHealth.ok, error: dbHealth.error })
  let session: Awaited<ReturnType<typeof requireUser>> | null = null
  const disabledFeatures = ['tokens', 'history', 'vault', 'exports'] as const
  const degradedMessage = 'Temporary database outage — results are available, but saving/export/history is disabled.'

  const runDegraded = async () => {
    let tool: ReturnType<typeof getToolMeta> | null = null
    try {
      tool = getToolMeta(data.toolId)
    } catch {
      tool = null
    }

    if (!tool) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: { message: 'Tool not found.', code: 'TOOL_ERROR' },
          requestId,
          degraded: true,
          degradedReason: 'DB_UNAVAILABLE',
          disabledFeatures: [...disabledFeatures],
          message: degradedMessage,
        },
        { status: 404, headers: { 'x-request-id': requestId } }
      )
    }

    const validation = validateInput(data.toolId, data.input)
    if (!validation.valid) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: {
            message: validation.errors?.message || 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: validation.errors?.details,
          },
          requestId,
          degraded: true,
          degradedReason: 'DB_UNAVAILABLE',
          disabledFeatures: [...disabledFeatures],
          message: degradedMessage,
        },
        { status: 400, headers: { 'x-request-id': requestId } }
      )
    }

    const allowDevGuest = process.env.NODE_ENV !== 'production'
    if (!leadCaptured && !allowDevGuest) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: { message: 'Unauthorized.', code: 'AUTH_ERROR' },
          requestId,
          degraded: true,
          degradedReason: 'DB_UNAVAILABLE',
          disabledFeatures: [...disabledFeatures],
          message: degradedMessage,
        },
        { status: 401, headers: { 'x-request-id': requestId } }
      )
    }

    const runner = runnerRegistry[tool.id]
    if (!runner) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: { message: 'Runner not implemented.', code: 'TOOL_ERROR' },
          requestId,
          degraded: true,
          degradedReason: 'DB_UNAVAILABLE',
          disabledFeatures: [...disabledFeatures],
          message: degradedMessage,
        },
        { status: 500, headers: { 'x-request-id': requestId } }
      )
    }

    try {
      log('runner_start', { degraded: true })
      const result = await runner(data, {
        user: { id: leadCaptured ? 'lead_guest' : 'dev_guest', planId: 'free' },
        toolMeta: tool,
        usage: { aiTokensRemaining: 0 },
        logger: { info: () => {}, error: () => {} },
      })
      log('runner_finish', { degraded: true })

      const outputError = (result as any)?.output?.error
      if (outputError) {
        return NextResponse.json<RunResponse>(
          {
            status: 'error',
            error: { message: outputError.message || 'AI output error.', code: outputError.errorCode || 'AI_ERROR' },
            requestId,
            degraded: true,
            degradedReason: 'DB_UNAVAILABLE',
            disabledFeatures: [...disabledFeatures],
            message: degradedMessage,
          },
          { status: 502, headers: { 'x-request-id': requestId } }
        )
      }

      return NextResponse.json<RunResponse>(
        {
          status: 'ok',
          output: result.output,
          runId,
          requestId,
          degraded: true,
          degradedReason: 'DB_UNAVAILABLE',
          disabledFeatures: [...disabledFeatures],
          message: degradedMessage,
          metering: {
            chargedTokens: 0,
            remainingTokens: 0,
            aiTokensUsed: 0,
            aiTokensCap: 0,
            runsUsed: 0,
            runsCap: 0,
            resetsAtISO: new Date().toISOString(),
            meteringMode: 'trial',
          },
        },
        { status: 200, headers: { 'x-request-id': requestId } }
      )
    } catch (err: any) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: { message: err?.message || 'Tool error.', code: 'TOOL_ERROR' },
          requestId,
          degraded: true,
          degradedReason: 'DB_UNAVAILABLE',
          disabledFeatures: [...disabledFeatures],
          message: degradedMessage,
        },
        { status: 502, headers: { 'x-request-id': requestId } }
      )
    }
  }

  if (!degraded) {
    try {
      if (!leadCaptured) {
        await assertDbReadyOnce()
        session = await requireUser()
      } else {
        try {
          await assertDbReadyOnce()
          session = await requireUser()
        } catch {
          session = null
        }
      }
    } catch (err: any) {
      log('auth_db_failed', { message: err?.message || 'Unknown error' })
      degraded = true
    }
  }

  if (degraded) {
    return runDegraded()
  }

  if (!session && leadCaptured) {
    log('lead_guest_session', { leadCaptured: true })
    let tool: ReturnType<typeof getToolMeta> | null = null
    try {
      tool = getToolMeta(data.toolId)
    } catch {
      tool = null
    }

    if (!tool) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: { message: 'Tool not found.', code: 'TOOL_ERROR' },
          requestId,
        },
        { status: 404, headers: { 'x-request-id': requestId } }
      )
    }

    try {
        log('runner_start', { leadGuest: true })
        const result = await runnerRegistry[tool.id](data, {
        user: { id: 'lead_guest', planId: 'free' },
        toolMeta: tool,
        usage: { aiTokensRemaining: 100000 },
        logger: { info: () => {}, error: () => {} },
      })
        log('runner_finish', { leadGuest: true })

      return NextResponse.json<RunResponse>(
        {
          status: 'ok',
          output: result.output,
          runId,
          requestId,
          metering: {
            chargedTokens: 0,
            remainingTokens: 0,
            aiTokensUsed: 0,
            aiTokensCap: 0,
            runsUsed: 0,
            runsCap: 0,
            resetsAtISO: new Date().toISOString(),
            meteringMode: 'trial',
          },
        },
        { status: 200, headers: { 'x-request-id': requestId } }
      )
    } catch (err: any) {
      return NextResponse.json<RunResponse>(
        {
          status: 'error',
          error: { message: err?.message || 'Tool error.', code: 'TOOL_ERROR' },
          requestId,
        },
        { status: 500, headers: { 'x-request-id': requestId } }
      )
    }
  }

  if (!session) {
    log('auth_missing', { leadCaptured })
    return NextResponse.json<RunResponse>(
      {
        status: 'error',
        error: { message: 'Unauthorized.', code: 'AUTH_ERROR' },
        requestId,
      },
      { status: 401, headers: { 'x-request-id': requestId } }
    )
  }

  const userId = session.id
  log('auth_ok', { userIdPresent: Boolean(userId) })

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
    log('tool_not_found')
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
    log('locked_role')
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
      log('duplicate_run')
      await recordRun({ status: 'error', lockCode: 'duplicate', errorCode: 'DUPLICATE_RUN' })
      return jsonWithRequestId(
        { status: 'error', error: { message: 'Duplicate run_id; request already processed.', code: 'DUPLICATE_RUN' }, requestId },
        { status: 409 }
      )
    }
  }

  const validation = validateInput(data.toolId, data.input)
  if (!validation.valid) {
    log('input_validation_failed')
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
    log('tool_disabled')
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
    log('locked_plan_category')
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
    log('locked_plan_tool_cap')
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
    log('locked_usage_daily')
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
    log('locked_tokens_cap')
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
    log('locked_tool_daily')
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
    log('locked_trial')
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
    log('locked_tokens_balance')
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
    log('runner_missing')
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
    log('dry_run')
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
    log('runner_start', { meteringMode })
    const output = await runner(data, {
      user: { id: userId, planId: personalPlan },
      toolMeta: tool,
      usage: { aiTokensRemaining: tokenBalance },
      logger: { info: () => undefined, error: () => undefined },
    })
    log('runner_finish', { meteringMode })

    const outputError = (output as any)?.output?.error
    if (outputError) {
      log('ai_output_error', { code: outputError.errorCode || outputError.code })
      await recordRun({
        status: 'error',
        lockCode: 'tool_error',
        errorCode: outputError.errorCode || outputError.code || 'AI_ERROR',
        outputSummary: summarizeValue(outputError),
      })

      return jsonWithRequestId(
        {
          status: 'error',
          error: {
            message: outputError.message || 'AI output error.',
            code: outputError.errorCode || outputError.code || 'AI_ERROR',
          },
          inputEcho: data.input ?? {},
          requestId,
        },
        { status: 502 }
      )
    }

    if (data.mode === 'trial' && trial.allowed) {
      markTrialUsed(userId, tool.id)
    }

    let remainingBonusRuns = bonusRemaining
    let chargedTokens = 0

    try {
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
    } catch (err: any) {
      log('metering_write_failed', { message: err?.message || 'Unknown error' })
    }

    let updatedBalance = tokenBalance
    try {
      updatedBalance = await getTokenBalance(userId)
    } catch (err: any) {
      log('metering_read_failed', { message: err?.message || 'Unknown error' })
    }

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
    try {
      await addRun(userId, tool.id, runId, response)
    } catch (err: any) {
      log('add_run_failed', { message: err?.message || 'Unknown error' })
    }

    try {
      const sanitizedInput = sanitizeInputPayload(data.input ?? {}) as Prisma.InputJsonValue
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
        log('tool_run_write_failed', { message: err?.message || 'Unknown error' })
      }
    }

    try {
      await recordRun({
        status: 'ok',
        meteringMode,
        tokensCharged: chargedTokens,
        lockCode: null,
        outputSummary: summarizeValue(output.output),
      })
    } catch (err: any) {
      log('record_run_failed', { message: err?.message || 'Unknown error' })
    }

    return jsonWithRequestId(response)
  } catch (err: any) {
    const normalized = isProviderError(err) ? err : normalizePrismaError(err)
    log('provider_error', { code: normalized.code, message: normalized.message })

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
