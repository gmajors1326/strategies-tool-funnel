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

/**
 * UsageSnapshot
 * IMPORTANT:
 * - dailyRunsUsed is total runs today
 * - perToolRunsUsed is per-tool runs today (optional but preferred)
 * - purchasedTokensRemaining is the user's current token wallet balance
 * - dailyAiTokensUsed / dailyAiTokenCap are the daily metering caps (AI spend limit)
 */
export type UsageSnapshot = {
  dailyRunsUsed: number
  dailyRunCap: number
  dailyAiTokensUsed: number
  dailyAiTokenCap: number
  purchasedTokensRemaining: number
  perToolRunsUsed?: Record<string, number>
}

const CTA = {
  upgrade: { label: 'Upgrade Plan', href: '/pricing' },
  usage: { label: 'View Usage', href: '/app/usage' },
  buyTokens: { label: 'Buy Tokens', href: '/pricing' },
}

export const computeToolStatus = (
  tool: ToolConfig,
  planId: PlanId,
  usage: UsageSnapshot
): ToolAccessDecision => {
  // Offline tool
  if (!tool.enabled) {
    return { status: 'disabled', reason: 'Temporarily offline' }
  }

  const planConfig = getPlanConfig(planId)
  const toolDailyCap = tool.dailyRunsByPlan[planId] ?? 0

  // Not available on this plan
  if (toolDailyCap <= 0) {
    return {
      status: 'locked_plan',
      reason: 'Upgrade required',
      cta: CTA.upgrade,
      runsRemainingForTool: 0,
    }
  }

  // 1) Plan-level run cap (total)
  if (usage.dailyRunsUsed >= usage.dailyRunCap) {
    return {
      status: 'locked_usage_daily',
      reason: 'Daily run cap reached',
      cta: CTA.usage,
      runsRemainingForTool: 0,
    }
  }

  // 2) Tool-level run cap (per-tool)
  const toolRunsUsed = usage.perToolRunsUsed?.[tool.id] ?? 0
  const runsRemainingForTool = Math.max(toolDailyCap - toolRunsUsed, 0)

  if (runsRemainingForTool <= 0) {
    return {
      status: 'locked_usage_daily',
      reason: 'Daily tool cap reached',
      cta: CTA.usage,
      runsRemainingForTool: 0,
    }
  }

  // 3) Daily AI token cap (metering)
  // Deterministic tools still have tokensPerRun in the registry, but you might choose to
  // not count them toward AI caps. If you want deterministic to count, remove this guard.
  const countsTowardAiCap = tool.type !== 'deterministic'
  const wouldExceedDailyAiCap =
    countsTowardAiCap && usage.dailyAiTokensUsed + tool.tokensPerRun > usage.dailyAiTokenCap

  if (wouldExceedDailyAiCap) {
    return {
      status: 'locked_tokens',
      reason: 'Daily token cap reached',
      cta: CTA.usage,
      runsRemainingForTool,
    }
  }

  // 4) Wallet tokens (the actual spendable balance)
  // If the wallet is short, block cleanly.
  if (usage.purchasedTokensRemaining < tool.tokensPerRun) {
    return {
      status: 'locked_tokens',
      reason: 'Not enough tokens',
      cta: CTA.buyTokens,
      runsRemainingForTool,
    }
  }

  // 5) Optional: plan-level overage rules (if you keep this in plans config)
  // If allowTokenOverage is false, we treat "overage" as purchasing/upgrade path.
  // (This is mainly relevant if you later separate daily included tokens vs purchased tokens.)
  if (planConfig && (planConfig as any).allowTokenOverage === false) {
    // If you later split daily included vs purchased tokens, enforce here.
    // For now, wallet tokens already passed, so nothing to do.
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
