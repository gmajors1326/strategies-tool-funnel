import { NextResponse } from 'next/server'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import {
  dailyAiTokenCapByPlan,
  dailyRunCapByPlan,
  orgAiTokenCapByPlan,
  orgRunCapByPlan,
} from '@/src/lib/usage/caps'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'
import { getActiveOrg } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = 'user_dev_1'
  const entitlement = await getOrCreateEntitlement(userId)
  const personalPlan = entitlement.plan as 'free' | 'pro_monthly' | 'team' | 'lifetime'
  const activeOrg = await getActiveOrg(userId)
  const orgPlan = activeOrg?.plan as 'business' | 'enterprise' | undefined
  const planRunCap = orgPlan ? orgRunCapByPlan[orgPlan] : dailyRunCapByPlan[personalPlan]
  const planTokenCap = orgPlan ? orgAiTokenCapByPlan[orgPlan] : dailyAiTokenCapByPlan[personalPlan]
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
  })
}
