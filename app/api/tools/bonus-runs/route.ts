import { NextRequest, NextResponse } from 'next/server'
import { getBonusRunsSummary } from '@/src/lib/tool/bonusRuns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('toolId')
  if (!toolId) {
    return NextResponse.json({ error: 'toolId required' }, { status: 400 })
  }

  const userId = 'user_dev_1'
  const summary = await getBonusRunsSummary({ userId, toolId })

  return NextResponse.json({
    grantedRuns: summary.grantedRuns,
    usedRuns: summary.usedRuns,
    remainingRuns: summary.remainingRuns,
    expiresAt: summary.expiresAt,
  })
}
