import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { getMockRefundDetail } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { refundId: string } }
) {
  await requireAdmin()
  // TODO: replace (billing): fetch refund details from billing system.
  return NextResponse.json(getMockRefundDetail(params.refundId))
}
