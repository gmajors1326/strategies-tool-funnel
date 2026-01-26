import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { getMockRefundDetail } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ refundId: string }> }
) {
  const { refundId } = await params
  try {
    await requireAdminAccess(request, {
      action: 'admin.refund.view',
      policy: 'support',
      target: refundId,
    })
  } catch (err: any) {
    const status = err?.status || 403
    return NextResponse.json({ error: 'Unauthorized' }, { status })
  }

  try {
    // TODO: replace (billing): fetch refund details from billing system.
    return NextResponse.json(await getMockRefundDetail(refundId))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Refund detail unavailable.' }, { status: 200 })
  }
}
