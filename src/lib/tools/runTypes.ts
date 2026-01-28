export type RunMode = 'paid' | 'trial'
export type TrialMode = 'sandbox' | 'live' | 'preview'

export type LockState =
  | 'ok'
  | 'locked_tokens'
  | 'locked_usage_daily'
  | 'locked_tool_daily'
  | 'locked_plan'
  | 'locked_trial'
  | 'locked_role'

export type RunRequest = {
  toolId: string
  mode: RunMode
  trialMode?: TrialMode
  input: Record<string, any>
  runId?: string
}

export type RunLock = {
  code: LockState
  message: string
  cta: { type: 'wait_reset' | 'upgrade' | 'buy_tokens' | 'contact' | 'login'; href?: string }
  resetsAtISO?: string
  requiredTokens?: number
  remainingTokens?: number
  usage?: {
    aiTokensUsed: number
    aiTokensCap: number
    runsUsed: number
    runsCap: number
    toolRunsUsed?: number
    toolRunsCap?: number
  }
}

export type RunError = {
  code: 'ACCESS_BLOCKED' | 'VALIDATION_ERROR' | 'TOOL_ERROR' | 'PROVIDER_ERROR' | 'DUPLICATE_RUN' | string
  message: string
  accessState?: LockState
  cta?: { label: string; href: string }
  details?: any
}

export type RunResponse = {
  status: 'ok' | 'locked' | 'error'
  lock?: RunLock
  output?: any
  degraded?: boolean
  degradedReason?: string
  disabledFeatures?: Array<'tokens' | 'history' | 'vault' | 'exports'>
  message?: string
  requestId?: string
  metering?: {
    chargedTokens: number
    remainingTokens: number
    aiTokensUsed: number
    aiTokensCap: number
    runsUsed: number
    runsCap: number
    resetsAtISO: string
    meteringMode?: 'bonus_run' | 'tokens' | 'trial' | 'admin'
    remainingBonusRuns?: number
    orgId?: string | null
  }
  error?: { message: string; code?: string; details?: any }
  runId?: string
}
