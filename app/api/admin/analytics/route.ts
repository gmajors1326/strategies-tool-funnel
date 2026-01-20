import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, canViewAnalytics } from '@/lib/adminAuth'
import { AnalyticsFilters } from '@/lib/analytics/types'
import { buildMockAnalytics } from '@/lib/analytics/mockData'

export const runtime = 'nodejs'

function parseFilters(req: NextRequest): AnalyticsFilters {
  const { searchParams } = new URL(req.url)
  const preset = (searchParams.get('preset') ?? '7d') as AnalyticsFilters['preset']
  const from = searchParams.get('from') ?? undefined
  const to = searchParams.get('to') ?? undefined

  return {
    preset,
    from,
    to,
    toolId: searchParams.get('toolId') ?? undefined,
    plan: searchParams.get('plan') ?? undefined,
    country: searchParams.get('country') ?? undefined,
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!canViewAnalytics(admin.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const filters = parseFilters(req)

    // TODO: Replace mock builder with real DB queries:
    // const data = await buildAnalyticsFromDb(filters)
    const data = buildMockAnalytics(filters)

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
