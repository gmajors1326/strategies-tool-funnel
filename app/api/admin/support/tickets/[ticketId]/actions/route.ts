import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { logAdminAudit } from '@/src/lib/admin/audit'

const actionSchema = z.object({
  actionType: z.string(),
  payload: z.record(z.any()).optional(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const admin = await requireAdmin()
  const body = await request.json()
  const { actionType, payload } = actionSchema.parse(body)
  const { ticketId } = await params

  await logAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: 'admin.support.action',
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
