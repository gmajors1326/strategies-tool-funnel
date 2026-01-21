// app/api/tools/bonus-runs/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getBonusRunsSummary } from '@/src/lib/tool/bonusRuns'
import { requireUser } from '@/src/lib/auth/requireUser'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const toolId = searchParams.get('toolId')
  if (!toolId) {
    return NextResponse.json({ error: 'toolId required' }, { status: 400 })
  }

  // Optional: admin can inspect another user's bonus runs via ?userId=
  const requestedUserId = searchParams.get('userId')

  let userId: string
  if (requestedUserId) {
    await requireAdmin()
    userId = requestedUserId
  } else {
    const session = await requireUser()
    userId = session.id
  }

  const summary = await getBonusRunsSummary({ userId, toolId })

  return NextResponse.json({
    grantedRuns: summary.grantedRuns,
    usedRuns: summary.usedRuns,
    remainingRuns: summary.remainingRuns,
    expiresAt: summary.expiresAt,
  })
}
