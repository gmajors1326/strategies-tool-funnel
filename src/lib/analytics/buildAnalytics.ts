import type { AnalyticsFilters, AnalyticsResponse, TimeSeriesPoint, ToolUsageRow } from '@/lib/analytics/types'
import { prisma } from '@/src/lib/prisma'

const DAY_MS = 24 * 60 * 60 * 1000

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function resolveDateRange(filters: AnalyticsFilters) {
  const now = startOfDay(new Date())
  const preset = (filters.preset ?? '7d') as AnalyticsResponse['range']['preset']

  if (preset === 'custom' && (filters.from || filters.to)) {
    const from = startOfDay(filters.from ? new Date(filters.from) : now)
    const to = startOfDay(filters.to ? new Date(filters.to) : now)
    return { from, to, preset }
  }

  if (preset === 'today') {
    return { from: now, to: now, preset }
  }

  const days =
    preset === '90d' ? 90 : preset === '30d' ? 30 : preset === '14d' ? 14 : preset === '7d' ? 7 : 7
  const from = startOfDay(new Date(now.getTime() - (days - 1) * DAY_MS))
  return { from, to: now, preset }
}

function buildDateSeries(from: Date, to: Date): TimeSeriesPoint[] {
  const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY_MS) + 1)
  return Array.from({ length: days }).map((_, i) => ({
    date: toISODate(new Date(from.getTime() + i * DAY_MS)),
    value: 0,
  }))
}

export async function buildAnalytics(filters: AnalyticsFilters): Promise<AnalyticsResponse> {
  const { from, to, preset } = resolveDateRange(filters)
  const rangeFrom = new Date(from)
  const rangeTo = new Date(to.getTime() + DAY_MS - 1)

  const toolIdFilter = filters.toolId ? filters.toolId : undefined

  const runs = await prisma.toolRunLog.findMany({
    where: {
      toolId: toolIdFilter,
      createdAt: { gte: rangeFrom, lte: rangeTo },
    },
    select: {
      toolId: true,
      userId: true,
      status: true,
      lockCode: true,
      durationMs: true,
      tokensCharged: true,
      createdAt: true,
    },
  })

  const aiUsage = await prisma.aiUsageLog.findMany({
    where: {
      toolKey: toolIdFilter,
      createdAt: { gte: rangeFrom, lte: rangeTo },
    },
    select: {
      toolKey: true,
      costEstimate: true,
      tokensIn: true,
      tokensOut: true,
      createdAt: true,
    },
  })

  const toolAggs = new Map<string, ToolUsageRow>()
  const toolCostAgg = new Map<string, { cost: number; calls: number }>()
  const toolLatencyAgg = new Map<string, { total: number; count: number }>()
  const toolUsers = new Map<string, Set<string>>()

  const perDayRuns = new Map<string, number>()
  const perDayAiCost = new Map<string, { cost: number; calls: number; tokensIn: number; tokensOut: number }>()
  const overallUsers = new Set<string>()

  runs.forEach((run) => {
    const toolId = run.toolId
    if (!toolAggs.has(toolId)) {
      toolAggs.set(toolId, {
        toolId,
        runs: 0,
        uniqueUsers: 0,
        successRatePct: 0,
        lockedRatePct: 0,
        errorRatePct: 0,
        avgLatencyMs: 0,
        avgCostUsd: 0,
        lockedRuns: 0,
        errorRuns: 0,
      })
    }
    const agg = toolAggs.get(toolId)!
    agg.runs += 1
    if (run.status === 'locked') agg.lockedRuns += 1
    if (run.status === 'error') agg.errorRuns += 1

    if (run.userId) {
      overallUsers.add(run.userId)
      if (!toolUsers.has(toolId)) toolUsers.set(toolId, new Set())
      toolUsers.get(toolId)!.add(run.userId)
    }

    if (run.durationMs != null) {
      const latency = toolLatencyAgg.get(toolId) ?? { total: 0, count: 0 }
      latency.total += run.durationMs
      latency.count += 1
      toolLatencyAgg.set(toolId, latency)
    }

    const day = toISODate(run.createdAt)
    perDayRuns.set(day, (perDayRuns.get(day) ?? 0) + 1)
  })

  aiUsage.forEach((entry) => {
    const toolKey = entry.toolKey
    if (!toolKey) return
    const cost = entry.costEstimate ?? 0
    const agg = toolCostAgg.get(toolKey) ?? { cost: 0, calls: 0 }
    agg.cost += cost
    agg.calls += 1
    toolCostAgg.set(toolKey, agg)

    const day = toISODate(entry.createdAt)
    const dayAgg = perDayAiCost.get(day) ?? { cost: 0, calls: 0, tokensIn: 0, tokensOut: 0 }
    dayAgg.cost += cost
    dayAgg.calls += 1
    dayAgg.tokensIn += entry.tokensIn ?? 0
    dayAgg.tokensOut += entry.tokensOut ?? 0
    perDayAiCost.set(day, dayAgg)
  })

  const toolUsage: ToolUsageRow[] = Array.from(toolAggs.values()).map((agg) => {
    const users = toolUsers.get(agg.toolId)?.size ?? 0
    const successRuns = agg.runs - agg.lockedRuns - agg.errorRuns
    const successRate = agg.runs ? Math.round((successRuns / agg.runs) * 1000) / 10 : 0
    const lockedRate = agg.runs ? Math.round((agg.lockedRuns / agg.runs) * 1000) / 10 : 0
    const errorRate = agg.runs ? Math.round((agg.errorRuns / agg.runs) * 1000) / 10 : 0
    const latency = toolLatencyAgg.get(agg.toolId)
    const avgLatency = latency?.count ? Math.round(latency.total / latency.count) : 0
    const cost = toolCostAgg.get(agg.toolId)
    const avgCost = cost?.calls ? Math.round((cost.cost / cost.calls) * 10000) / 10000 : 0

    return {
      ...agg,
      uniqueUsers: users,
      successRatePct: successRate,
      lockedRatePct: lockedRate,
      errorRatePct: errorRate,
      avgLatencyMs: avgLatency,
      avgCostUsd: avgCost,
    }
  })

  const toolRunsSeries = buildDateSeries(from, to).map((point) => ({
    ...point,
    value: perDayRuns.get(point.date) ?? 0,
  }))

  const aiCosts = buildDateSeries(from, to).map((point) => {
    const day = perDayAiCost.get(point.date)
    return {
      date: point.date,
      costUsd: Math.round((day?.cost ?? 0) * 100) / 100,
      calls: day?.calls ?? 0,
      tokensIn: day?.tokensIn ?? 0,
      tokensOut: day?.tokensOut ?? 0,
    }
  })

  const totalRuns = toolUsage.reduce((acc, row) => acc + row.runs, 0)
  const totalAiCost = aiCosts.reduce((acc, row) => acc + row.costUsd, 0)

  return {
    range: { from: toISODate(from), to: toISODate(to), preset },
    kpis: [
      { label: 'Sessions', value: 0 },
      { label: 'Signups', value: 0 },
      { label: 'Tool Runs', value: totalRuns },
      { label: 'Revenue (USD)', value: 0 },
      { label: 'AI Cost (USD)', value: Math.round(totalAiCost * 100) / 100 },
      { label: 'Unique Users', value: overallUsers.size },
    ],
    timeseries: {
      sessions: buildDateSeries(from, to),
      signups: buildDateSeries(from, to),
      toolRuns: toolRunsSeries,
      revenueUsd: buildDateSeries(from, to),
    },
    funnel: [
      { step: 'Landing Views', users: 0, conversionPct: 100 },
      { step: 'Signups', users: 0, conversionPct: 0 },
      { step: 'Activated (1st Tool Run)', users: overallUsers.size, conversionPct: 0 },
      { step: 'Paid', users: 0, conversionPct: 0 },
    ],
    toolUsage: toolUsage.sort((a, b) => b.runs - a.runs),
    aiCosts,
    recentErrors: [],
  }
}
