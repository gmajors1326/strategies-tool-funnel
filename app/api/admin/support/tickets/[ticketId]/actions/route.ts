import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAccess } from '@/lib/adminAuth'

const actionSchema = z.object({
  actionType: z.string(),
  payload: z.record(z.any()).optional(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const body = await request.json()
  const { actionType, payload } = actionSchema.parse(body)
  const { ticketId } = await params

  await requireAdminAccess(request, {
    action: 'admin.support.action',
    policy: 'support',
    target: ticketId,
    meta: { actionType, payload },
  })
  // TODO: replace (ui): execute real admin action against support system.
  return NextResponse.json({
    ticketId,
    actionType,
    payload,
    status: 'ok',
  })
}
