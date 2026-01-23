import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { requireUser } from '@/src/lib/auth/requireUser'
import { TOOL_REGISTRY } from '@/src/lib/tools/registry'

export const dynamic = 'force-dynamic'

function parseCursor(cursor?: string | null) {
  if (!cursor) return null
  const [time, id] = cursor.split('|')
  const date = new Date(time)
  if (!id || Number.isNaN(date.getTime())) return null
  return { date, id }
}

export async function GET(request: NextRequest) {
  const session = await requireUser()
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || '25'), 100)
  const toolId = searchParams.get('toolId')
  const status = searchParams.get('status')
  const cursor = parseCursor(searchParams.get('cursor'))

  const where: any = { userId: session.id }
  if (toolId && toolId !== 'all') where.toolId = toolId
  if (status && status !== 'all') where.status = status
  if (cursor) {
    where.OR = [
      { createdAt: { lt: cursor.date } },
      { createdAt: cursor.date, id: { lt: cursor.id } },
    ]
  }

  const rows = (await prisma.toolRunLog.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })) as Array<any>

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore
    ? `${page[page.length - 1].createdAt.toISOString()}|${page[page.length - 1].id}`
    : null

  return NextResponse.json({
    items: page.map((row) => ({
      id: row.id,
      toolId: row.toolId,
      toolName: (TOOL_REGISTRY as Record<string, { name?: string }>)[row.toolId]?.name,
      status:
        row.status === 'ok'
          ? 'success'
          : row.status === 'error'
            ? 'failed'
            : ('locked' as const),
      tokensCharged: row.tokensCharged ?? 0,
      inputSummary: row.inputSummary || undefined,
      createdAt: row.createdAt.toISOString(),
      errorCode: row.errorCode || undefined,
    })),
    nextCursor,
  })
}
