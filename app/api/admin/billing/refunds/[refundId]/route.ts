import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getMockRefundDetail } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { refundId: string } }
) {
  try {
    await requireAdmin()
  } catch (err: any) {
    const status = err?.status || 403
    return NextResponse.json({ error: 'Unauthorized' }, { status })
  }

  try {
    // TODO: replace (billing): fetch refund details from billing system.
    return NextResponse.json(await getMockRefundDetail(params.refundId))
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Refund detail unavailable.' }, { status: 200 })
  }
}
