import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, canViewAnalytics } from '@/lib/adminAuth'
import { buildMockAnalytics } from '@/lib/analytics/mockData'

export const runtime = 'nodejs'

function toCSV(rows: Record<string, any>[]) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (value: any) => {
    const str = String(value ?? '')
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replaceAll('"', '""')}"`
    }
    return str
  }
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n')
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!canViewAnalytics(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const format = (searchParams.get('format') ?? 'json').toLowerCase()

    const data = buildMockAnalytics({
      preset: (searchParams.get('preset') ?? '7d') as any,
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      toolId: searchParams.get('toolId') ?? undefined,
      plan: searchParams.get('plan') ?? undefined,
      country: searchParams.get('country') ?? undefined,
    })

    if (format === 'csv') {
      const kpiRows = data.kpis.map((k) => ({ type: 'kpi', label: k.label, value: k.value, deltaPct: k.deltaPct ?? '' }))
      const toolRows = data.toolUsage.map((t) => ({ type: 'tool', ...t }))
      const aiRows = data.aiCosts.map((a) => ({ type: 'ai', ...a }))
      const csv = toCSV([...kpiRows, ...toolRows, ...aiRows])

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="analytics_export.csv"',
        },
      })
    }

    return NextResponse.json(data, {
      headers: {
        'Content-Disposition': 'attachment; filename="analytics_export.json"',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
