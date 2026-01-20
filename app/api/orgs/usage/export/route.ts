import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { getActiveOrg, requireOrgRole, logAudit } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

const toCsv = (rows: string[][]) =>
  rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')

export async function GET(request: NextRequest) {
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
    orderBy: { createdAt: 'desc' },
  })

  const rows = [
    ['timestamp_utc', 'timestamp_local', 'user_id', 'tool_id', 'tokens_charged', 'metering_mode', 'status', 'lock_code', 'duration_ms'],
    ...logs.map((log) => [
      log.createdAt.toISOString(),
      log.createdAt.toLocaleString('en-US', { timeZone: 'America/Chicago' }),
      log.userId,
      log.toolId,
      String(log.tokensCharged),
      log.meteringMode,
      log.status,
      log.lockCode || '',
      String(log.durationMs || 0),
    ]),
  ]

  await logAudit({ orgId: activeOrg.id, userId, action: 'usage_export', meta: { month } })

  const csv = toCsv(rows)
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="usage-${month}.csv"`,
    },
  })
}
