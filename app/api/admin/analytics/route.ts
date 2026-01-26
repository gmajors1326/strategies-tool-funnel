import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { buildAnalytics, buildEmptyAnalytics } from '@/src/lib/analytics/buildAnalytics'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const filters = {
    preset: (searchParams.get('preset') ?? '7d') as any,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    toolId: searchParams.get('toolId') ?? undefined,
    plan: searchParams.get('plan') ?? undefined,
    country: searchParams.get('country') ?? undefined,
  }

  try {
    await requireAdminAccess(req, {
      action: 'admin.analytics.view',
      policy: 'analytics',
      meta: { filters },
    })
  } catch (err: any) {
    const status = err?.status || 403
    return NextResponse.json({ error: 'Unauthorized' }, { status })
  }

  try {
    const data = await buildAnalytics(filters)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(buildEmptyAnalytics(filters))
  }
}
