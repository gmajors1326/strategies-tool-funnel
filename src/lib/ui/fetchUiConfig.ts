// src/lib/ui/fetchUiConfig.ts
import { headers } from 'next/headers'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getActiveOrg } from '@/src/lib/orgs/orgs'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'

import { TOOL_REGISTRY } from '@/src/lib/tools/registry'
import { computeToolStatus } from '@/src/lib/usage/limits'

export type UiTool = {
  id: string
  name: string
  type: string
  status: ReturnType<typeof computeToolStatus>['status']
  reason?: string
  cta?: { label: string; href: string }
  tokensPerRun?: number
  runsRemainingForTool?: number
}

export type UiConfig = {
  user: { id: string; email: string; planId: string; role?: string }
  usage: {
    dailyRunsUsed: number
    dailyRunCap: number
    dailyAiTokensUsed: number
    dailyAiTokenCap: number
    purchasedTokensRemaining: number
    resetsAtISO: string
  }
  myTools: UiTool[]
  catalogTools: UiTool[]
}

function isProd() {
  return process.env.NODE_ENV === 'production'
}

/**
 * fetchUiConfig()
 * Server-only helper used by server components.
 * Builds UI config from real session + DB-backed usage + tool registry.
 */
export async function fetchUiConfig(): Promise<UiConfig> {
  const session = await requireUser()
  const userId = session.id

  // Determine personal plan
  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)

  // Org context can change caps (and access later)
  const activeOrg = await getActiveOrg(userId)
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

  const usageWindow = await ensureUsageWindow(userId)
  const tokenBalance = await getTokenBalance(userId)

  const usage = {
    dailyRunsUsed: usageWindow.runsUsed,
    dailyRunCap: planRunCap,
    dailyAiTokensUsed: usageWindow.aiTokensUsed,
    dailyAiTokenCap: planTokenCap,
    purchasedTokensRemaining: tokenBalance,
    resetsAtISO: usageWindow.resetsAt.toISOString(),
  }

  const user = {
    id: session.id,
    email: session.email,
    planId: personalPlan,
    role: session.role ?? 'user',
  }

  const catalogTools: UiTool[] = TOOL_REGISTRY.map((tool) => {
    const decision = computeToolStatus(tool as any, user.planId as any, usage as any)
    return {
      id: tool.id,
      name: tool.name,
      type: tool.type,
      status: decision.status,
      reason: decision.reason,
      cta: decision.cta,
      tokensPerRun: (tool as any).tokensPerRun,
      runsRemainingForTool: decision.runsRemainingForTool,
    }
  })

  // “My Tools” = tools that are runnable or already unlocked-ish
  // (tweak this filter any time)
  const myTools = catalogTools.filter((t) => t.status === 'available' || t.status === 'trial' || t.status === 'limited')

  // Keep it tight
  const myToolsTop = myTools.slice(0, 6)

  // In production, never quietly claim “no tools” if registry exists.
  if (isProd() && TOOL_REGISTRY.length > 0 && myToolsTop.length === 0) {
    // This usually means computeToolStatus/plan mapping is miswired.
    // Better to surface the issue than look empty.
    throw new Error('UI config resolved to zero myTools in production. Check plan/tool access mapping.')
  }

  return {
    user,
    usage,
    myTools: myToolsTop,
    catalogTools,
  }
}
