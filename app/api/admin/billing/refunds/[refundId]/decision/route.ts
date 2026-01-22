import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/adminAuth'
import { logAudit } from '@/src/lib/orgs/orgs'

const decisionSchema = z.object({
  decision: z.enum(['approve', 'deny', 'partial', 'credit']),
  amount: z.number().optional(),
  reason: z.string(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { refundId: string } }
) {
  const admin = await requireAdmin()
  const body = await request.json()
  const data = decisionSchema.parse(body)

  await logAudit({
    userId: admin.userId,
    action: 'admin.refund.decision',
    targetId: params.refundId,
    meta: {
      decision: data.decision,
      amount: data.amount ?? null,
      reason: data.reason,
      adminEmail: admin.email,
    },
  })

  // TODO: replace (billing): issue refund decision through billing provider.
  return NextResponse.json({
    refundId: params.refundId,
    decision: data.decision,
    amount: data.amount ?? null,
    reason: data.reason,
    status: 'ok',
  })
}
