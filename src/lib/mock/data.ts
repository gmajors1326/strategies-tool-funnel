// src/lib/mock/data.ts
import { getPlanConfig, type PlanId } from '@/src/lib/plans'
import { computeToolStatus } from '@/src/lib/usage/limits'
import { TOOL_REGISTRY, type ToolConfig } from '@/src/lib/tools/registry'

import { requireUser } from '@/src/lib/auth/requireUser'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import { getActiveOrg } from '@/src/lib/orgs/orgs'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'

export type UiConfigTool = {
  id: string
  name: string
  type: ToolConfig['type']
  status: ReturnType<typeof computeToolStatus>['status']
  reason?: string
  cta?: { label: string; href: string }
  tokensPerRun?: number
  runsRemainingForTool?: number
}

export type UiConfig = {
  user: { id: string; email: string; planId: PlanId; role?: string }
  usage: {
    dailyRunsUsed: number
    dailyRunCap: number
    dailyAiTokensUsed: number
    dailyAiTokenCap: number
    purchasedTokensRemaining: number
    resetsAtISO: string
  }
  toolsMyTools: UiConfigTool[]
  toolsCatalog: UiConfigTool[]
}

function isProd() {
  return process.env.NODE_ENV === 'production'
}

function devFallbackAllowed() {
  return !isProd() && process.env.DEV_AUTH_BYPASS === 'true'
}

/**
 * REAL usage snapshot (replaces getMockUsage)
 * Uses:
 * - entitlement plan
 * - active org (if any)
 * - usage window (DB-backed)
 * - token ledger balance (DB-backed)
 */
export const getUsage = async (planId?: PlanId) => {
  const session = await requireUser()
  const userId = session.id

  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)

  const activeOrg = await getActiveOrg(userId)
  const orgPlan = activeOrg?.plan as 'business' | 'enterprise' | undefined
  const orgPlanKey = getPlanKeyFromOrgPlan(orgPlan)

  const personalCaps = getPlanCaps(personalPlanKey)

  const dailyRunCap = orgPlanKey
    ? getPlanCaps(orgPlanKey).runsPerDay
    : orgPlan === 'enterprise'
      ? orgRunCapByPlan.enterprise
      : personalCaps.runsPerDay

  const dailyAiTokenCap = orgPlanKey
    ? getPlanCaps(orgPlanKey).tokensPerDay
    : orgPlan === 'enterprise'
      ? orgAiTokenCapByPlan.enterprise
      : personalCaps.tokensPerDay

  const usage = await ensureUsageWindow(userId)
  const tokenBalance = await getTokenBalance(userId)

  // Keep the shape your UI already expects
  return {
    dailyRunsUsed: usage.runsUsed,
    dailyRunCap,
    dailyAiTokensUsed: usage.aiTokensUsed,
    dailyAiTokenCap,
    purchasedTokensRemaining: tokenBalance,
    resetsAtISO: usage.resetsAt.toISOString(),
  }
}

/**
 * REAL UI config (replaces getMockUiConfig)
 * Builds tool statuses from TOOL_REGISTRY + computeToolStatus using real usage + real plan.
 */
export const getUiConfig = async (): Promise<UiConfig> => {
  const session = await requireUser()
  const userId = session.id

  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as PlanId

  // We keep planId as the user’s personal plan for UI decisions,
  // but usage caps may be org-influenced inside getUsage().
  const usage = await getUsage(personalPlan)

  const user = {
    id: session.id,
    email: session.email,
    planId: personalPlan,
    role: session.role ?? 'user',
  }

  const toolsCatalog: UiConfigTool[] = TOOL_REGISTRY.map((tool) => {
    const decision = computeToolStatus(tool, user.planId, usage)
    return {
      id: tool.id,
      name: tool.name,
      type: tool.type,
      status: decision.status,
      reason: decision.reason,
      cta: decision.cta,
      tokensPerRun: tool.tokensPerRun,
      runsRemainingForTool: decision.runsRemainingForTool,
    }
  })

  const toolsMyTools = toolsCatalog.slice(0, 4)

  return {
    user,
    usage,
    toolsMyTools,
    toolsCatalog,
  }
}

/**
 * Backward-compatible exports
 * If the rest of your app imports getMockUsage/getMockUiConfig, keep them working,
 * but route them to the real implementations.
 */
export const getMockUsage = (planId: PlanId) => {
  // Kept for compatibility; prefer getUsage() going forward.
  // Returning sync here would break callers; so we provide a deterministic dev-only snapshot.
  // Use getUsage() in any server component or API route.
  const plan = getPlanConfig(planId)
  return {
    dailyRunsUsed: 0,
    dailyRunCap: (plan as any).dailyRunCap ?? 0,
    dailyAiTokensUsed: 0,
    dailyAiTokenCap: (plan as any).dailyAiTokenCap ?? 0,
    purchasedTokensRemaining: 0,
    resetsAtISO: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
  }
}

export const getMockUiConfig = async (): Promise<UiConfig> => {
  // Kept for compatibility; prefer getUiConfig() going forward.
  return getUiConfig()
}

/**
 * SUPPORT / BILLING / ANALYTICS
 * These MUST NOT return fake data in production.
 * In dev, return empty states to keep UI stable until routes are wired.
 */

export const getMockTickets = async () => {
  if (isProd()) {
    throw new Error('Support tickets not implemented: replace getMockTickets() with real backend store.')
  }
  return devFallbackAllowed() ? [] : []
}

export const getMockTicketDetail = async (ticketId: string) => {
  if (isProd()) {
    throw new Error('Support ticket detail not implemented: replace getMockTicketDetail() with real backend store.')
  }
  return devFallbackAllowed()
    ? {
        id: ticketId,
        status: 'open',
        category: 'usage',
        subject: 'Support system not wired yet',
        createdAtISO: new Date().toISOString(),
        thread: [],
      }
    : {
        id: ticketId,
        status: 'open',
        category: 'usage',
        subject: 'Support system not wired yet',
        createdAtISO: new Date().toISOString(),
        thread: [],
      }
}

export const getMockRefunds = async () => {
  if (isProd()) {
    throw new Error('Refund queue not implemented: replace getMockRefunds() with Stripe + DB-backed workflow.')
  }
  return devFallbackAllowed() ? [] : []
}

export const getMockRefundDetail = async (refundId: string) => {
  if (isProd()) {
    throw new Error('Refund detail not implemented: replace getMockRefundDetail() with Stripe + DB-backed workflow.')
  }
  return devFallbackAllowed()
    ? {
        id: refundId,
        status: 'pending',
        eligibility: 'unknown',
        reason: 'Refund workflow not wired yet',
        createdAtISO: new Date().toISOString(),
      }
    : {
        id: refundId,
        status: 'pending',
        eligibility: 'unknown',
        reason: 'Refund workflow not wired yet',
        createdAtISO: new Date().toISOString(),
      }
}

export const getMockAnalytics = async () => {
  if (isProd()) {
    throw new Error('Analytics not implemented: replace getMockAnalytics() with real aggregation queries.')
  }
  return {
    kpis: [],
    charts: { runsByDay: [], tokenUsage: [] },
    tables: { topTools: [] },
  }
}
