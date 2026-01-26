import type { UiConfig } from '@/src/lib/ui/types'
import { listTools } from '@/src/lib/tools/registry'
import { isLaunchTool } from '@/src/lib/tools/launchTools'
import { getBonusRunsSummary } from '@/src/lib/tool/bonusRuns'
import { getTrialState } from '@/src/lib/tool/trialLedger'
import { orgAiTokenCapByPlan, orgRunCapByPlan } from '@/src/lib/usage/caps'
import { ensureUsageWindow } from '@/src/lib/usage/dailyUsage'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { getActiveOrg, getMembership } from '@/src/lib/orgs/orgs'
import { getPlanCaps, getPlanKeyFromEntitlement, getPlanKeyFromOrgPlan } from '@/src/lib/billing/planConfig'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getFreeTrialStatus } from '@/src/lib/usage/freeTrial'

type UserPlanState = {
  user: { id: string; email: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
}

export const resolveUserPlanState = async (): Promise<UserPlanState> => {
  const session = await requireUser()
  return {
    user: {
      id: session.id,
      email: session.email,
      planId: session.planId,
    },
  }
}

export const buildUiConfig = async (): Promise<UiConfig> => {
  const { user } = await resolveUserPlanState()
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
  const trialStatus =
    user.planId === 'free' && !orgPlanKey ? await getFreeTrialStatus(user.id, 'free') : null
  const trialExpired = Boolean(trialStatus?.expired)
  const usageWindow = await ensureUsageWindow(user.id)
  const tokenBalance = await getTokenBalance(user.id)

  const catalog = await Promise.all(
    listTools().filter((tool) => isLaunchTool(tool.id)).map(async (tool) => {
      const trial = getTrialState(user.id, tool.id)
      const bonus = await getBonusRunsSummary({ userId: user.id, toolId: tool.id })
      const toolCap = tool.dailyRunsByPlan?.[user.planId] ?? 0
      const toolRunsUsed = (usageWindow.per_tool_runs_used as Record<string, number>)?.[tool.id] ?? 0

      let lockState: UiConfig['catalog'][number]['lockState'] = 'available'
      let reason: string | undefined
      let cta = { label: 'Run tool', href: `/app/tools/${tool.id}` }

      if (trialExpired) {
        lockState = 'locked'
        reason = 'Your 7-day free trial has ended. Choose Pro or Elite to keep running tools.'
        cta = { label: 'Choose a plan', href: '/pricing' }
      } else if (membership?.role === 'viewer') {
        lockState = 'locked'
        reason = 'Viewer role cannot run tools'
        cta = { label: 'Upgrade seat', href: `/orgs/${activeOrg?.slug}/members` }
      } else if (toolCap <= 0) {
        lockState = 'trial'
        if (trial.allowed || bonus.remainingRuns > 0) {
          reason = bonus.remainingRuns > 0 ? 'Bonus sandbox runs available' : 'Sandbox available'
          cta = { label: 'Run guided example', href: `/app/tools/${tool.id}?mode=trial&trialMode=sandbox` }
        } else {
          reason = 'Trial used'
          cta = { label: 'Unlock tool', href: '/pricing' }
          lockState = 'locked'
        }
      } else if (usageWindow.runs_used >= planRunCap) {
        lockState = 'limited'
        reason = 'Daily run cap reached'
        cta = { label: 'Wait for reset', href: '/app/usage' }
      } else if (toolRunsUsed >= toolCap) {
        lockState = 'limited'
        reason = 'Daily tool cap reached'
        cta = { label: 'Wait for reset', href: '/app/usage' }
      } else if (tool.aiLevel !== 'none' && usageWindow.ai_tokens_used >= planTokenCap) {
        lockState = 'locked'
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
        runsRemainingToday: Math.max(toolCap - toolRunsUsed, 0),
        bonusRunsRemaining: bonus.remainingRuns,
      }
    })
  )

  const myTools = catalog.filter((tool) => tool.lockState === 'available')

  return {
    user,
    usage: {
      dailyRunsUsed: usageWindow.runs_used,
      dailyRunCap: planRunCap,
      aiTokensUsed: usageWindow.ai_tokens_used,
      aiTokenCap: planTokenCap,
      tokensRemaining: tokenBalance,
      purchasedTokensRemaining: tokenBalance,
      resetsAtISO: usageWindow.resets_at.toISOString(),
    },
    myTools,
    catalog,
    catalogTools: catalog,
  }
}
