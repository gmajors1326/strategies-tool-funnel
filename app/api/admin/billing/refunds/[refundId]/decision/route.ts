import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitAdminAction, requireAdminAccess } from '@/lib/adminAuth'
import { rateLimitConfigs } from '@/lib/rate-limit'

const decisionSchema = z.object({
  decision: z.enum(['approve', 'deny', 'partial', 'credit']),
  amount: z.number().optional(),
  reason: z.string(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ refundId: string }> }
) {
  const body = await request.json()
  const data = decisionSchema.parse(body)
  const { refundId } = await params

  const admin = await requireAdminAccess(request, {
    action: 'admin.refund.decision',
    policy: 'admin',
    target: refundId,
    meta: {
      decision: data.decision,
      amount: data.amount ?? null,
      reason: data.reason,
    },
  })

  const rateLimit = await rateLimitAdminAction(admin, 'refund.decision', rateLimitConfigs.adminSensitiveAction)
  if (!rateLimit.success) {
    const headers = new Headers()
    Object.entries(rateLimit.headers).forEach(([key, value]) => {
      if (value) headers.set(key, value)
    })
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429, headers }
    )
  }

  // TODO: replace (billing): issue refund decision through billing provider.
  return NextResponse.json({
    refundId,
    decision: data.decision,
    amount: data.amount ?? null,
    reason: data.reason,
    status: 'ok',
  })
}
