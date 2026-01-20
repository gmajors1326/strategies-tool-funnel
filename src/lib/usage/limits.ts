import type { PlanId } from '@/src/lib/plans'
import { getPlanConfig } from '@/src/lib/plans'
import type { ToolConfig } from '@/src/lib/tools/registry'

export type ToolAccessStatus =
  | 'available'
  | 'locked_plan'
  | 'locked_purchase'
  | 'locked_usage_daily'
  | 'locked_tokens'
  | 'disabled'

export type ToolAccessDecision = {
  status: ToolAccessStatus
  reason?: string
  cta?: { label: string; href: string }
  runsRemainingForTool?: number
}

export type UsageSnapshot = {
  dailyRunsUsed: number
  dailyRunCap: number
  dailyAiTokensUsed: number
  dailyAiTokenCap: number
  purchasedTokensRemaining: number
}

export const computeToolStatus = (
  tool: ToolConfig,
  planId: PlanId,
  usage: UsageSnapshot
): ToolAccessDecision => {
  if (!tool.enabled) {
    return { status: 'disabled', reason: 'Temporarily offline' }
  }

  const planConfig = getPlanConfig(planId)
  const toolDailyCap = tool.dailyRunsByPlan[planId] ?? 0

  if (toolDailyCap === 0) {
    return {
      status: 'locked_plan',
      reason: 'Upgrade required',
      cta: { label: 'Upgrade Plan', href: '/app/account/billing' },
    }
  }

  const runsRemainingForTool = Math.max(toolDailyCap - usage.dailyRunsUsed, 0)
  if (runsRemainingForTool <= 0 || usage.dailyRunsUsed >= usage.dailyRunCap) {
    return {
      status: 'locked_usage_daily',
      reason: 'Daily run limit reached',
      cta: { label: 'Get More Runs', href: '/app/usage' },
      runsRemainingForTool: 0,
    }
  }

  const tokensRemaining = usage.dailyAiTokenCap - usage.dailyAiTokensUsed
  if (tokensRemaining < tool.tokensPerRun && usage.purchasedTokensRemaining <= 0) {
    return {
      status: 'locked_tokens',
      reason: 'Insufficient tokens',
      cta: { label: 'Buy Tokens', href: '/app/usage' },
    }
  }

  if (!planConfig.allowTokenOverage && tokensRemaining < tool.tokensPerRun) {
    return {
      status: 'locked_purchase',
      reason: 'Token overage disabled',
      cta: { label: 'Upgrade Plan', href: '/app/account/billing' },
    }
  }

  return {
    status: 'available',
    runsRemainingForTool,
  }
}

export const canRunTool = (
  tool: ToolConfig,
  planId: PlanId,
  usage: UsageSnapshot
): ToolAccessDecision => {
  return computeToolStatus(tool, planId, usage)
}
