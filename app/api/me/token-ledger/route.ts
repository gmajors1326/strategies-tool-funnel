import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { requireUser } from '@/src/lib/auth/requireUser'

export const dynamic = 'force-dynamic'

const REASON_MAP: Record<string, string> = {
  purchase_pack: 'purchase',
  purchase: 'purchase',
  spend_tool: 'spend',
  refund: 'refund',
  reversal: 'refund',
  adjustment: 'adjustment',
  admin: 'admin',
  reset: 'reset',
}

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
  const cursor = parseCursor(searchParams.get('cursor'))

  const where: any = { user_id: session.id }
  if (cursor) {
    where.OR = [
      { created_at: { lt: cursor.date } },
      { created_at: cursor.date, id: { lt: cursor.id } },
    ]
  }

  const rows = (await prisma.tokenLedger.findMany({
    where,
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: limit + 1,
  })) as Array<any>

  const hasMore = rows.length > limit
  const page = hasMore ? rows.slice(0, limit) : rows
  const nextCursor = hasMore
    ? `${page[page.length - 1].created_at.toISOString()}|${page[page.length - 1].id}`
    : null

  return NextResponse.json({
    items: page.map((row) => ({
      id: row.id,
      createdAt: row.created_at.toISOString(),
      delta: row.tokens_delta,
      reason: REASON_MAP[row.event_type] || 'adjustment',
      sku: row.reason?.startsWith('purchase:') ? row.reason : undefined,
      stripePaymentIntentId: row.stripe_payment_intent_id || undefined,
      note: row.reason || undefined,
    })),
    nextCursor,
  })
}
