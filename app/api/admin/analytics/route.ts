import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { buildAnalytics } from '@/src/lib/analytics/buildAnalytics'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const data = await buildAnalytics({
    preset: (searchParams.get('preset') ?? '7d') as any,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    toolId: searchParams.get('toolId') ?? undefined,
    plan: searchParams.get('plan') ?? undefined,
    country: searchParams.get('country') ?? undefined,
  })

  return NextResponse.json(data)
}
