export type DateRangePreset =
  | 'today'
  | '7d'
  | '14d'
  | '30d'
  | '90d'
  | 'custom'

export type AnalyticsFilters = {
  from?: string // ISO date
  to?: string // ISO date
  preset?: DateRangePreset
  toolId?: string
  plan?: string
  country?: string
}

export type KPIBlock = {
  label: string
  value: number
  deltaPct?: number // + / - vs previous period
}

export type TimeSeriesPoint = {
  date: string // YYYY-MM-DD
  value: number
}

export type FunnelRow = {
  step: string
  users: number
  conversionPct: number // from previous step
}

export type ToolUsageRow = {
  toolId: string
  runs: number
  uniqueUsers: number
  successRatePct: number
  avgLatencyMs: number
  avgCostUsd: number
}

export type AICostRow = {
  date: string // YYYY-MM-DD
  costUsd: number
  calls: number
  tokensIn: number
  tokensOut: number
}

export type ErrorRow = {
  time: string // ISO
  route: string
  errorType: string
  message: string
  requestId?: string
  userId?: string
}

export type AnalyticsResponse = {
  range: { from: string; to: string; preset: DateRangePreset }
  kpis: KPIBlock[]
  timeseries: {
    sessions: TimeSeriesPoint[]
    signups: TimeSeriesPoint[]
    toolRuns: TimeSeriesPoint[]
    revenueUsd: TimeSeriesPoint[]
  }
  funnel: FunnelRow[]
  toolUsage: ToolUsageRow[]
  aiCosts: AICostRow[]
  recentErrors: ErrorRow[]
}
