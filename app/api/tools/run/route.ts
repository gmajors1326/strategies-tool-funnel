import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { TOOL_META } from '@/src/lib/tools/toolMeta'
import { validateInput } from '@/src/lib/tools/validate'
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

const requestSchema = z.object({
  toolId: z.string(),
  mode: z.enum(['paid', 'trial']),
  trialMode: z.enum(['sandbox', 'live', 'preview']).optional(),
  input: z.record(z.any()),
  runId: z.string().optional(),
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const body = await request.json()
  const data = requestSchema.parse(body) as RunRequest
  const userId = 'user_dev_1'
  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)
  const tool = TOOL_META.find((item) => item.id === data.toolId)

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

  const recordRun = async (params: {
    status: string
    lockCode?: string | null
    meteringMode?: string
    tokensCharged?: number
  }) => {
    await logToolRun({
      orgId: activeOrg?.id,
      userId,
      toolId: data.toolId,
      runId: data.runId || 'pending',
      meteringMode: params.meteringMode || 'tokens',
      tokensCharged: params.tokensCharged || 0,
      status: params.status,
      lockCode: params.lockCode || null,
      durationMs: Date.now() - startedAt,
    })
  }

  if (!tool) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Tool not found.',
          cta: { type: 'contact', href: '/app/support' },
        }),
      },
      { status: 404 }
    )
  }

  if (membership?.role === 'viewer') {
    await recordRun({ status: 'locked', lockCode: 'locked_role' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_role',
          message: 'Viewer seats cannot run tools.',
          cta: { type: 'upgrade', href: activeOrg ? `/orgs/${activeOrg.slug}/members` : '/pricing' },
        }),
      },
      { status: 403 }
    )
  }

  if (data.runId) {
    const existing = await prisma.tokenLedger.findFirst({ where: { runId: data.runId } })
    if (existing) {
      await recordRun({ status: 'error', lockCode: 'duplicate' })
      return NextResponse.json<RunResponse>(
        { status: 'error', error: { message: 'Duplicate run_id; request already processed.', code: 'DUPLICATE_RUN' } },
        { status: 409 }
      )
    }
  }

  const validation = validateInput(data.toolId, data.input)
  if (!validation.valid) {
    await recordRun({ status: 'error', lockCode: 'validation' })
    return NextResponse.json<RunResponse>(
      {
        status: 'error',
        error: {
          message: validation.errors?.message || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: validation.errors?.details,
        },
      },
      { status: 400 }
    )
  }

  if (!tool.enabled) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Tool is offline.',
          cta: { type: 'contact', href: '/app/support' },
        }),
      },
      { status: 403 }
    )
  }

  if (data.mode === 'paid' && tool.requiresPurchase && !orgPlan && !tool.includedInPlans?.includes(personalPlan)) {
    await recordRun({ status: 'locked', lockCode: 'locked_plan' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_plan',
          message: 'Tool requires purchase.',
          cta: { type: 'upgrade', href: '/pricing' },
        }),
      },
      { status: 403 }
    )
  }

  const usage = await ensureUsageWindow(userId)
  const toolCap = tool.dailyRunsByPlan?.[personalPlan] ?? planRunCap
  const toolRunsUsed = (usage.perToolRunsUsed as Record<string, number>)?.[tool.id] ?? 0

  if (usage.runsUsed >= planRunCap) {
    await recordRun({ status: 'locked', lockCode: 'locked_usage_daily' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_usage_daily',
          message: 'Daily run cap reached.',
          cta: { type: 'wait_reset', href: '/app/usage' },
          usage: {
            runsUsed: usage.runsUsed,
            runsCap: planRunCap,
            aiTokensUsed: usage.aiTokensUsed,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
          },
          resetsAtISO: usage.resetsAt.toISOString(),
        }),
      },
      { status: 403 }
    )
  }

  if (usage.aiTokensUsed >= planTokenCap && tool.aiLevel !== 'none') {
    await recordRun({ status: 'locked', lockCode: 'locked_tokens' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_tokens',
          message: 'Daily token cap reached.',
          cta: { type: 'buy_tokens', href: '/pricing' },
          usage: {
            runsUsed: usage.runsUsed,
            runsCap: planRunCap,
            aiTokensUsed: usage.aiTokensUsed,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
          },
          resetsAtISO: usage.resetsAt.toISOString(),
        }),
      },
      { status: 403 }
    )
  }

  if (toolRunsUsed >= toolCap) {
    await recordRun({ status: 'locked', lockCode: 'locked_tool_daily' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_tool_daily',
          message: 'Daily tool cap reached.',
          cta: { type: 'wait_reset', href: '/app/usage' },
          usage: {
            runsUsed: usage.runsUsed,
            runsCap: planRunCap,
            aiTokensUsed: usage.aiTokensUsed,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
          },
          resetsAtISO: usage.resetsAt.toISOString(),
        }),
      },
      { status: 403 }
    )
  }

  const trial = getTrialState(userId, tool.id)
  const bonusRemaining = await getBonusRunsRemainingForTool({ userId, toolId: tool.id })
  if (data.mode === 'trial' && !trial.allowed && bonusRemaining <= 0) {
    await recordRun({ status: 'locked', lockCode: 'locked_trial' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_trial',
          message: 'Trial used.',
          cta: { type: 'upgrade', href: '/pricing' },
        }),
      },
      { status: 403 }
    )
  }

  const tokenBalance = await getTokenBalance(userId)
  const requiredTokens = tool.tokensPerRun
  const meteringMode =
    bonusRemaining > 0 && data.mode !== 'trial' ? 'bonus_run' : data.mode === 'trial' ? 'trial' : 'tokens'

  if (meteringMode === 'tokens' && tokenBalance < requiredTokens) {
    await recordRun({ status: 'locked', lockCode: 'locked_tokens' })
    return NextResponse.json<RunResponse>(
      {
        status: 'locked',
        lock: buildLock({
          code: 'locked_tokens',
          message: 'Not enough tokens.',
          cta: { type: 'buy_tokens', href: '/pricing' },
          requiredTokens,
          remainingTokens: tokenBalance,
        }),
      },
      { status: 403 }
    )
  }

  const runner = runnerRegistry[data.toolId]
  if (!runner) {
    await recordRun({ status: 'error', lockCode: 'tool_error' })
    return NextResponse.json<RunResponse>(
      { status: 'error', error: { message: 'Runner not implemented.', code: 'TOOL_ERROR' } },
      { status: 500 }
    )
  }

  const runId = data.runId || crypto.randomUUID()
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
            userId,
            eventType: 'spend_tool',
            tokensDelta: -requiredTokens,
            toolId: tool.id,
            runId,
            reason: 'tool_run',
          },
        })
        chargedTokens = requiredTokens
      }

      await incrementUsageTx({
        tx,
        userId,
        windowEnd: usage.windowEnd,
        toolId: tool.id,
        tokensUsed: meteringMode === 'tokens' ? requiredTokens : 0,
      })
    })

    const updatedBalance = await getTokenBalance(userId)
    const response: RunResponse = {
      status: 'ok',
      data: output.output,
      runId,
      metering: {
        chargedTokens,
        remainingTokens: updatedBalance,
        aiTokensUsed: usage.aiTokensUsed + (meteringMode === 'tokens' ? requiredTokens : 0),
        aiTokensCap: planTokenCap,
        runsUsed: usage.runsUsed + 1,
        runsCap: planRunCap,
        resetsAtISO: usage.resetsAt.toISOString(),
        meteringMode,
        remainingBonusRuns,
        orgId: activeOrg?.id ?? null,
      },
    }
    addRun(userId, response)
    await logToolRun({
      orgId: activeOrg?.id,
      userId,
      toolId: tool.id,
      runId,
      meteringMode,
      tokensCharged: chargedTokens,
      status: 'ok',
      durationMs: Date.now() - startedAt,
    })
    return NextResponse.json(response)
  } catch {
    await logToolRun({
      orgId: activeOrg?.id,
      userId,
      toolId: tool.id,
      runId,
      meteringMode: 'tokens',
      tokensCharged: 0,
      status: 'error',
      durationMs: Date.now() - startedAt,
    })
    return NextResponse.json<RunResponse>(
      { status: 'error', error: { message: 'Tool execution failed.', code: 'TOOL_ERROR' } },
      { status: 500 }
    )
  }
}
