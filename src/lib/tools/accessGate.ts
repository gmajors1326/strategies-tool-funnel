import type { LockState, RunLock } from '@/src/lib/tools/runTypes'
import type { ToolMeta } from '@/src/lib/tools/toolMeta'

type UsageCaps = {
  runsUsed: number
  runsCap: number
  aiTokensUsed: number
  aiTokensCap: number
  toolRunsUsed: number
  toolRunsCap: number
}

export const buildLock = (params: {
  code: LockState
  message: string
  cta: RunLock['cta']
  usage?: UsageCaps
  requiredTokens?: number
  remainingTokens?: number
  resetsAtISO?: string
}): RunLock => ({
  code: params.code,
  message: params.message,
  cta: params.cta,
  usage: params.usage
    ? {
        aiTokensUsed: params.usage.aiTokensUsed,
        aiTokensCap: params.usage.aiTokensCap,
        runsUsed: params.usage.runsUsed,
        runsCap: params.usage.runsCap,
        toolRunsUsed: params.usage.toolRunsUsed,
        toolRunsCap: params.usage.toolRunsCap,
      }
    : undefined,
  requiredTokens: params.requiredTokens,
  remainingTokens: params.remainingTokens,
  resetsAtISO: params.resetsAtISO,
})

export const isToolAccessibleForPlan = (tool: ToolMeta, planId: string) => {
  if (!tool.requiresPurchase) return tool.includedInPlans?.includes(planId as any)
  return tool.includedInPlans?.includes(planId as any)
}
