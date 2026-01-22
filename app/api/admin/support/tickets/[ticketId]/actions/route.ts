import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'

const actionSchema = z.object({
  actionType: z.string(),
  payload: z.record(z.any()).optional(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  await requireAdmin()
  const body = await request.json()
  const { actionType, payload } = actionSchema.parse(body)
  // TODO: replace (ui): execute real admin action against support system.
  return NextResponse.json({
    ticketId: params.ticketId,
    actionType,
    payload,
    status: 'ok',
  })
}
