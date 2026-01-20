import type { LockState } from '@/src/lib/tools/runTypes'

export type ToolUiItem = {
  id: string
  name: string
  category: string
  aiLevel: 'none' | 'light' | 'heavy'
  lockState: LockState
  reason?: string
  cta: { label: string; href: string }
  tokensPerRun?: number
  runsRemainingToday?: number
  bonusRunsRemaining?: number
}

export type UiConfig = {
  user: { id: string; email: string; planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
  usage: {
    dailyRunsUsed: number
    dailyRunCap: number
    aiTokensUsed: number
    aiTokenCap: number
    tokensRemaining: number
    purchasedTokensRemaining: number
    resetsAtISO: string
  }
  myTools: ToolUiItem[]
  catalog: ToolUiItem[]
}
