// src/lib/ui/fetchUiConfig.ts
import { requireUser } from '@/src/lib/auth/requireUser'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getActiveOrg } from '@/src/lib/orgs/orgs'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'

import { TOOL_REGISTRY, type ToolConfig } from '@/src/lib/tools/registry'
import { computeToolStatus, type ToolAccessStatus } from '@/src/lib/usage/limits'
import type { ToolAiLevel, ToolUiItem, UiConfig, UiLockState } from '@/src/lib/ui/types'

function isProd() {
  return process.env.NODE_ENV === 'production'
}

function mapToolTypeToAiLevel(type: ToolConfig['type']): ToolAiLevel {
  if (type === 'deterministic') return 'none'
  if (type === 'light_ai') return 'light'
  return 'heavy'
}

/**
 * Keep categories simple for now (we can upgrade to real categories later).
 * Cards just need something stable to badge/group on.
 */
function mapToolTypeToCategory(type: ToolConfig['type']): string {
  if (type === 'deterministic') return 'Workflow'
  if (type === 'light_ai') return 'Growth'
  return 'Strategy'
}

function mapStatusToLockState(status: ToolAccessStatus): UiLockState {
  switch (status) {
    case 'available':
      return 'available'
    case 'locked_usage_daily':
      return 'limited'
    case 'disabled':
      return 'disabled'
    case 'locked_plan':
    case 'locked_purchase':
    case 'locked_tokens':
    default:
      return 'locked'
  }
}

export async function fetchUiConfig(): Promise<UiConfig> {
  const session = await requireUser()
  const userId = session.id

  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)

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

  // Canonical UiConfig usage keys (matches src/lib/ui/types.ts)
  const usage = {
    dailyRunsUsed: usageWindow.runsUsed,
    dailyRunCap: planRunCap,
    aiTokensUsed: usageWindow.aiTokensUsed,
    aiTokenCap: planTokenCap,
    tokensRemaining: tokenBalance,
    purchasedTokensRemaining: tokenBalance,
    resetsAtISO: usageWindow.resetsAt.toISOString(),
    perToolRunsUsed: (usageWindow.perToolRunsUsed as Record<string, number>) || {},
  }

  const user = {
    id: session.id,
    email: session.email,
    planId: personalPlan,
    role: session.role ?? 'user',
  }

  const catalogTools: ToolUiItem[] = TOOL_REGISTRY.map((tool) => {
    const decision = computeToolStatus(tool, user.planId, usage)
    return {
      id: tool.id,
      name: tool.name,
      category: mapToolTypeToCategory(tool.type),
      aiLevel: mapToolTypeToAiLevel(tool.type),
      lockState: mapStatusToLockState(decision.status),
      reason: decision.reason,
      cta: decision.cta,
      tokensPerRun: tool.tokensPerRun,
      runsRemainingToday: decision.runsRemainingForTool,
    }
  })

  const myTools = catalogTools.filter((t) => t.lockState === 'available')

  if (isProd() && TOOL_REGISTRY.length > 0 && catalogTools.length === 0) {
    throw new Error('UI config resolved to zero tools in production. Check tool registry export.')
  }

  return {
    user,
    usage,
    myTools: myTools.slice(0, 6),
    catalogTools,
    catalog: catalogTools,
  }
}
