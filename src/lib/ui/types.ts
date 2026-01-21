export type UiPlanId = 'free' | 'pro_monthly' | 'team' | 'lifetime'

/**
 * Canonical UI lock state.
 * Keep it simple for the frontend.
 */
export type UiLockState = 'available' | 'trial' | 'limited' | 'locked' | 'disabled'

export type ToolAiLevel = 'none' | 'light' | 'heavy'

export type ToolUiItem = {
  id: string
  name: string

  // Display metadata
  category: string
  aiLevel: ToolAiLevel

  // Access state
  lockState: UiLockState
  reason?: string
  cta?: { label: string; href: string }

  // Metering hints for cards
  tokensPerRun?: number
  runsRemainingToday?: number
  bonusRunsRemaining?: number
}

export type UiUsage = {
  dailyRunsUsed: number
  dailyRunCap: number
  aiTokensUsed: number
  aiTokenCap: number
  tokensRemaining: number
  purchasedTokensRemaining: number
  resetsAtISO: string
  perToolRunsUsed?: Record<string, number>
}

export type UiUser = {
  id: string
  email: string
  planId: UiPlanId
  role?: 'user' | 'admin'
}

export type UiConfig = {
  user: UiUser
  usage: UiUsage

  myTools: ToolUiItem[]

  /**
   * Canonical catalog list
   */
  catalogTools: ToolUiItem[]

  /**
   * Backward-compat alias (some pages used uiConfig.catalog)
   * Keep it until you finish the sweep.
   */
  catalog: ToolUiItem[]
}
