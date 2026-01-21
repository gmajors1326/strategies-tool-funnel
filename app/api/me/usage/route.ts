// app/api/me/usage/route.ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import { getActiveOrg } from '@/src/lib/orgs/orgs'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireUser()
  const userId = session.id

  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const personalPlanKey = getPlanKeyFromEntitlement(personalPlan)

  const activeOrg = await getActiveOrg(userId)
  const orgPlan = activeOrg?.plan as 'business' | 'enterprise' | undefined
  const orgPlanKey = getPlanKeyFromOrgPlan(orgPlan)

  const personalCaps = getPlanCaps(personalPlanKey)

  // Primary: planConfig (canonical)
  // Fallback: legacy org caps (enterprise) if planConfig mapping isn’t complete yet
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

  return NextResponse.json({
    dailyRunsUsed: usage.runsUsed,
    dailyRunCap: planRunCap,
    aiTokensUsed: usage.aiTokensUsed,
    aiTokenCap: planTokenCap,
    tokensRemaining: tokenBalance,
    purchasedTokensRemaining: tokenBalance,
    resetsAtISO: usage.resetsAt.toISOString(),
    perToolRunsUsed: (usage.perToolRunsUsed as Record<string, number>) || {},
  })
}
