import type { UiConfig } from '@/src/lib/ui/types'
import { TOOL_META } from '@/src/lib/tools/toolMeta'
import { getBonusRunsSummary } from '@/src/lib/tool/bonusRuns'
import { getTrialState } from '@/src/lib/tool/trialLedger'
import {
  dailyAiTokenCapByPlan,
  dailyRunCapByPlan,
  orgAiTokenCapByPlan,
  orgRunCapByPlan,
} from '@/src/lib/usage/caps'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getActiveOrg, getMembership } from '@/src/lib/orgs/orgs'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'

type UserPlanState = {
  user: { id: string; email: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
}

export const resolveUserPlanState = (): UserPlanState => {
  return {
    user: {
      id: 'user_dev_1',
      email: 'dev@example.com',
      planId: 'free',
    },
  }
}

export const buildUiConfig = async (): Promise<UiConfig> => {
  const { user } = resolveUserPlanState()
  const activeOrg = await getActiveOrg(user.id)
  const membership = activeOrg ? await getMembership(user.id, activeOrg.id) : null
  const orgPlan = activeOrg?.plan as 'business' | 'enterprise' | undefined
  const personalPlanKey = getPlanKeyFromEntitlement(user.planId)
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
  const usageWindow = await ensureUsageWindow(user.id)
  const tokenBalance = await getTokenBalance(user.id)

  const catalog = await Promise.all(
    TOOL_META.map(async (tool) => {
      const trial = getTrialState(user.id, tool.id)
      const bonus = await getBonusRunsSummary({ userId: user.id, toolId: tool.id })
      const toolCap = tool.dailyRunsByPlan?.[user.planId] ?? planRunCap
      const toolRunsUsed = (usageWindow.perToolRunsUsed as Record<string, number>)?.[tool.id] ?? 0

      let lockState: UiConfig['catalog'][number]['lockState'] = 'ok'
      let reason: string | undefined
      let cta = { label: 'Run tool', href: `/app/tools/${tool.id}` }

      if (membership?.role === 'viewer') {
        lockState = 'locked_role'
        reason = 'Viewer role cannot run tools'
        cta = { label: 'Upgrade seat', href: `/orgs/${activeOrg?.slug}/members` }
      } else if (!tool.enabled) {
        lockState = 'locked_plan'
        reason = 'Temporarily offline'
        cta = { label: 'Contact support', href: '/app/support' }
      } else if (tool.requiresPurchase && !tool.includedInPlans?.includes(user.planId)) {
        lockState = 'locked_trial'
        if (trial.allowed || bonus.remainingRuns > 0) {
          reason = bonus.remainingRuns > 0 ? 'Bonus sandbox runs available' : 'Sandbox available'
          cta = { label: 'Run guided example', href: `/app/tools/${tool.id}?mode=trial&trialMode=sandbox` }
        } else {
          reason = 'Trial used'
          cta = { label: 'Unlock tool', href: '/pricing' }
        }
      } else if (usageWindow.runsUsed >= planRunCap) {
        lockState = 'locked_usage_daily'
        reason = 'Daily run cap reached'
        cta = { label: 'Wait for reset', href: '/app/usage' }
      } else if (toolRunsUsed >= toolCap) {
        lockState = 'locked_tool_daily'
        reason = 'Daily tool cap reached'
        cta = { label: 'Wait for reset', href: '/app/usage' }
      } else if (tool.aiLevel !== 'none' && usageWindow.aiTokensUsed >= planTokenCap) {
        lockState = 'locked_tokens'
        reason = 'Daily token cap reached'
        cta = { label: 'Buy tokens', href: '/pricing' }
      }

      return {
        id: tool.id,
        name: tool.name,
        category: tool.category,
        aiLevel: tool.aiLevel,
        lockState,
        reason,
        cta,
        tokensPerRun: tool.tokensPerRun,
        runsRemainingToday: Math.max(planRunCap - usageWindow.runsUsed, 0),
        bonusRunsRemaining: bonus.remainingRuns,
      }
    })
  )

  const myTools = catalog.filter((tool) => tool.lockState === 'ok')

  return {
    user,
    usage: {
      dailyRunsUsed: usageWindow.runsUsed,
      dailyRunCap: planRunCap,
      aiTokensUsed: usageWindow.aiTokensUsed,
      aiTokenCap: planTokenCap,
      tokensRemaining: tokenBalance,
      purchasedTokensRemaining: tokenBalance,
      resetsAtISO: usageWindow.resetsAt.toISOString(),
    },
    myTools,
    catalog,
  }
}
