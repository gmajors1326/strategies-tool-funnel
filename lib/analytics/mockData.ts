import { AnalyticsFilters, AnalyticsResponse } from './types'

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10)
}

function daysBetween(from: Date, to: Date) {
  const ms = 24 * 60 * 60 * 1000
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / ms) + 1)
}

// TODO: replace (ui): build analytics from real telemetry data.
export function buildMockAnalytics(filters: AnalyticsFilters): AnalyticsResponse {
  const to = filters.to ? new Date(filters.to) : new Date()
  const from = filters.from
    ? new Date(filters.from)
    : new Date(to.getTime() - 6 * 24 * 60 * 60 * 1000)
  const preset = (filters.preset ?? '7d') as AnalyticsResponse['range']['preset']

  const n = daysBetween(from, to)

  const sessions = Array.from({ length: n }).map((_, i) => ({
    date: isoDay(new Date(from.getTime() + i * 24 * 60 * 60 * 1000)),
    value: Math.round(120 + Math.sin(i / 2) * 30 + i * 3),
  }))

  const signups = Array.from({ length: n }).map((_, i) => ({
    date: sessions[i].date,
    value: Math.max(0, Math.round(12 + Math.cos(i / 2) * 4 + i * 0.2)),
  }))

  const toolRuns = Array.from({ length: n }).map((_, i) => ({
    date: sessions[i].date,
    value: Math.max(0, Math.round(90 + Math.sin(i / 3) * 25 + i * 2)),
  }))

  const revenueUsd = Array.from({ length: n }).map((_, i) => ({
    date: sessions[i].date,
    value: Math.max(0, Math.round(220 + Math.sin(i / 4) * 80 + i * 8)),
  }))

  const totalSessions = sessions.reduce((a, b) => a + b.value, 0)
  const totalSignups = signups.reduce((a, b) => a + b.value, 0)
  const totalRuns = toolRuns.reduce((a, b) => a + b.value, 0)
  const totalRevenue = revenueUsd.reduce((a, b) => a + b.value, 0)

  return {
    range: { from: isoDay(from), to: isoDay(to), preset },
    kpis: [
      { label: 'Sessions', value: totalSessions, deltaPct: 8.2 },
      { label: 'Signups', value: totalSignups, deltaPct: 3.1 },
      { label: 'Tool Runs', value: totalRuns, deltaPct: 11.4 },
      { label: 'Revenue (USD)', value: totalRevenue, deltaPct: 6.7 },
      { label: 'AI Cost (USD)', value: 182, deltaPct: -2.9 },
      { label: 'Gross Margin (est.)', value: 74, deltaPct: 1.2 },
    ],
    timeseries: { sessions, signups, toolRuns, revenueUsd },
    funnel: [
      { step: 'Landing Views', users: totalSessions, conversionPct: 100 },
      {
        step: 'Signups',
        users: totalSignups,
        conversionPct: Math.round((totalSignups / Math.max(1, totalSessions)) * 1000) / 10,
      },
      { step: 'Activated (1st Tool Run)', users: Math.round(totalSignups * 0.62), conversionPct: 62 },
      { step: 'Paid', users: Math.round(totalSignups * 0.12), conversionPct: 19.4 },
    ],
    toolUsage: [
      {
        toolId: 'hook-analyzer',
        runs: 1240,
        uniqueUsers: 318,
        successRatePct: 97.2,
        lockedRatePct: 1.4,
        errorRatePct: 1.4,
        lockedRuns: 18,
        errorRuns: 17,
        avgLatencyMs: 480,
        avgCostUsd: 0.012,
      },
      {
        toolId: 'cta-match',
        runs: 882,
        uniqueUsers: 241,
        successRatePct: 98.4,
        lockedRatePct: 1.0,
        errorRatePct: 0.6,
        lockedRuns: 9,
        errorRuns: 5,
        avgLatencyMs: 310,
        avgCostUsd: 0.0,
      },
      {
        toolId: 'dm-intel',
        runs: 510,
        uniqueUsers: 144,
        successRatePct: 94.1,
        lockedRatePct: 3.1,
        errorRatePct: 2.8,
        lockedRuns: 16,
        errorRuns: 14,
        avgLatencyMs: 1120,
        avgCostUsd: 0.046,
      },
      {
        toolId: 'yt-analyzer',
        runs: 190,
        uniqueUsers: 66,
        successRatePct: 92.6,
        lockedRatePct: 4.2,
        errorRatePct: 3.2,
        lockedRuns: 8,
        errorRuns: 6,
        avgLatencyMs: 1780,
        avgCostUsd: 0.071,
      },
    ],
    aiCosts: Array.from({ length: n }).map((_, i) => ({
      date: sessions[i].date,
      costUsd: Math.max(0, Math.round((18 + Math.sin(i / 3) * 6) * 100) / 100),
      calls: Math.max(0, Math.round(90 + Math.cos(i / 4) * 20)),
      tokensIn: Math.max(0, Math.round(120000 + Math.sin(i / 2) * 14000)),
      tokensOut: Math.max(0, Math.round(98000 + Math.cos(i / 2) * 12000)),
    })),
    recentErrors: [
      {
        time: new Date().toISOString(),
        route: '/api/tools/run',
        errorType: 'RateLimit',
        message: 'Too many requests',
        requestId: 'req_9f3a2c',
        userId: 'anon',
      },
      {
        time: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
        route: '/api/ai/run',
        errorType: 'UpstreamTimeout',
        message: 'LLM provider timeout',
        requestId: 'req_1b77aa',
        userId: 'usr_2k91',
      },
    ],
  }
}
