import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getToolMeta } from '@/src/lib/tools/registry'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getActiveOrg, getMembership } from '@/src/lib/orgs/orgs'
import { assertDbReadyOnce, isProviderError, normalizePrismaError } from '@/src/lib/prisma/guards'

export const dynamic = 'force-dynamic'

const requestSchema = z.object({
  toolIds: z.array(z.string()).min(1).max(50),
})

type PreflightLockCode =
  | 'locked_tokens'
  | 'locked_usage_daily'
  | 'locked_tool_daily'
  | 'locked_plan'
  | 'locked_role'

export type ToolPreflightResult = {
  toolId: string
  status: 'ok' | 'locked'
  lockCode?: PreflightLockCode
  message?: string
  requiredTokens?: number
  remainingTokens?: number
  tokensPerRun?: number
  usage?: {
    runsUsed: number
    runsCap: number
    aiTokensUsed: number
    aiTokensCap: number
    toolRunsUsed?: number
    toolRunsCap?: number
    resetsAtISO?: string
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    await assertDbReadyOnce()

    const session = await requireUser()
    const userId = session.id

    const body = await request.json()
    const data = requestSchema.parse(body)

    const entitlement = await getOrCreateEntitlement(userId)
    const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
    const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)

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

    const usage = await ensureUsageWindow(userId)
    const tokenBalance = await getTokenBalance(userId)

    const results: ToolPreflightResult[] = data.toolIds.map((toolId) => {
      if (membership?.role === 'viewer') {
        return { toolId, status: 'locked', lockCode: 'locked_role', message: 'Viewer seats cannot run tools.' }
      }

      let tool
      try {
        tool = getToolMeta(toolId)
      } catch {
        return { toolId, status: 'locked', lockCode: 'locked_plan', message: 'Tool not found.' }
      }

      if (!tool.enabled) {
        return { toolId: tool.id, status: 'locked', lockCode: 'locked_plan', message: 'Tool is offline.' }
      }

      const toolCapForPlan = tool.dailyRunsByPlan?.[personalPlan] ?? 0
      if (toolCapForPlan <= 0) {
        return {
          toolId: tool.id,
          status: 'locked',
          lockCode: 'locked_plan',
          message: 'Requires purchase / plan access.',
          tokensPerRun: tool.tokensPerRun,
          requiredTokens: tool.tokensPerRun,
          remainingTokens: tokenBalance,
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            resetsAtISO: usage.resets_at.toISOString(),
          },
        }
      }

      const toolRunsUsed = (usage.per_tool_runs_used as Record<string, number>)?.[tool.id] ?? 0
      const toolCap = toolCapForPlan || planRunCap

      if (usage.runs_used >= planRunCap) {
        return {
          toolId: tool.id,
          status: 'locked',
          lockCode: 'locked_usage_daily',
          message: 'Daily run cap reached.',
          tokensPerRun: tool.tokensPerRun,
          requiredTokens: tool.tokensPerRun,
          remainingTokens: tokenBalance,
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
            resetsAtISO: usage.resets_at.toISOString(),
          },
        }
      }

      if (usage.ai_tokens_used >= planTokenCap && tool.aiLevel !== 'none') {
        return {
          toolId: tool.id,
          status: 'locked',
          lockCode: 'locked_tokens',
          message: 'Daily token cap reached.',
          tokensPerRun: tool.tokensPerRun,
          requiredTokens: tool.tokensPerRun,
          remainingTokens: tokenBalance,
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
            resetsAtISO: usage.resets_at.toISOString(),
          },
        }
      }

      if (toolRunsUsed >= toolCap) {
        return {
          toolId: tool.id,
          status: 'locked',
          lockCode: 'locked_tool_daily',
          message: 'Daily tool cap reached.',
          tokensPerRun: tool.tokensPerRun,
          requiredTokens: tool.tokensPerRun,
          remainingTokens: tokenBalance,
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
            resetsAtISO: usage.resets_at.toISOString(),
          },
        }
      }

      if (tokenBalance < tool.tokensPerRun) {
        return {
          toolId: tool.id,
          status: 'locked',
          lockCode: 'locked_tokens',
          message: 'Not enough tokens.',
          tokensPerRun: tool.tokensPerRun,
          requiredTokens: tool.tokensPerRun,
          remainingTokens: tokenBalance,
          usage: {
            runsUsed: usage.runs_used,
            runsCap: planRunCap,
            aiTokensUsed: usage.ai_tokens_used,
            aiTokensCap: planTokenCap,
            toolRunsUsed,
            toolRunsCap: toolCap,
            resetsAtISO: usage.resets_at.toISOString(),
          },
        }
      }

      return {
        toolId: tool.id,
        status: 'ok',
        tokensPerRun: tool.tokensPerRun,
        requiredTokens: tool.tokensPerRun,
        remainingTokens: tokenBalance,
        usage: {
          runsUsed: usage.runsUsed,
          runsCap: planRunCap,
          aiTokensUsed: usage.aiTokensUsed,
          aiTokensCap: planTokenCap,
          toolRunsUsed,
          toolRunsCap: toolCap,
          resetsAtISO: usage.resetsAt.toISOString(),
        },
      }
    })

    return NextResponse.json(
      { results },
      { headers: { 'x-request-id': requestId } }
    )
  } catch (err: any) {
    const normalized = isProviderError(err) ? err : normalizePrismaError(err)

    return NextResponse.json(
      {
        error: {
          code: 'PROVIDER_ERROR',
          message: normalized.message,
          details: normalized.details,
        },
      },
      { status: 503, headers: { 'x-request-id': requestId } }
    )
  }
}
