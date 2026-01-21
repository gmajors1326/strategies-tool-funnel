import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { getActiveOrg, requireOrgRole, logAudit } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // TODO: replace (auth): derive user ID from authenticated session.
  const userId = 'user_dev_1'
  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month') || ''
  const [yearStr, monthStr] = month.split('-')
  if (!yearStr || !monthStr) {
    return NextResponse.json({ error: 'month required (YYYY-MM)' }, { status: 400 })
  }

  const activeOrg = await getActiveOrg(userId)
  if (!activeOrg) {
    return NextResponse.json({ error: 'No active org' }, { status: 400 })
  }
  const membership = await requireOrgRole(userId, activeOrg.id, ['owner', 'admin'])
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const start = new Date(`${yearStr}-${monthStr}-01T00:00:00.000Z`)
  const end = new Date(start)
  end.setMonth(end.getMonth() + 1)

  const logs = await prisma.toolRunLog.findMany({
    where: {
      orgId: activeOrg.id,
      createdAt: { gte: start, lt: end },
    },
  })

  const totalTokens = logs.reduce((acc, log) => acc + log.tokensCharged, 0)
  const totalRuns = logs.length
  const locksCount = logs.filter((log) => log.status === 'locked').length

  const toolCounts: Record<string, number> = {}
  const userCounts: Record<string, number> = {}
  logs.forEach((log) => {
    toolCounts[log.toolId] = (toolCounts[log.toolId] || 0) + 1
    userCounts[log.userId] = (userCounts[log.userId] || 0) + 1
  })

  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const topUsers = Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  await logAudit({ orgId: activeOrg.id, userId, action: 'statement_viewed', meta: { month } })

  return NextResponse.json({
    totalTokens,
    totalRuns,
    locksCount,
    topTools,
    topUsers,
  })
}
