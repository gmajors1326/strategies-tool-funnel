import { consumeOneBonusRun, getBonusRunsRemainingForTool } from '@/src/lib/tool/bonusRuns'

export type MeteringMode = 'bonus_run' | 'tokens'

export type MeteringDecision =
  | {
      meteringMode: 'bonus_run'
      bonus: { consumedFromId: string; remainingBonusRuns: number }
    }
  | {
      meteringMode: 'tokens'
      bonus: { remainingBonusRuns: number }
    }

export async function decideMeteringMode(params: {
  userId: string
  toolId: string
  preferBonusRuns?: boolean
}): Promise<MeteringDecision> {
  const { userId, toolId, preferBonusRuns = true } = params

  const remainingBonusRuns = await getBonusRunsRemainingForTool({ userId, toolId })

  if (!preferBonusRuns || remainingBonusRuns <= 0) {
    return { meteringMode: 'tokens', bonus: { remainingBonusRuns } }
  }

  const consumed = await consumeOneBonusRun({ userId, toolId })

  if (!consumed.ok) {
    const remainingAfter = await getBonusRunsRemainingForTool({ userId, toolId })
    return { meteringMode: 'tokens', bonus: { remainingBonusRuns: remainingAfter } }
  }

  const remainingAfter = Math.max(0, remainingBonusRuns - 1)

  return {
    meteringMode: 'bonus_run',
    bonus: { consumedFromId: consumed.consumedFromId, remainingBonusRuns: remainingAfter },
  }
}
