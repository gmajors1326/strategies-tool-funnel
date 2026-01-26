import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { getMockRefunds } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdminAccess(request, {
      action: 'admin.refunds.list',
      policy: 'support',
    })
  } catch (err: any) {
    const status = err?.status || 403
    return NextResponse.json({ error: 'Unauthorized', refunds: [] }, { status })
  }

  try {
    // TODO: replace (billing): load refund queue from billing system.
    return NextResponse.json({ refunds: await getMockRefunds() })
  } catch (err: any) {
    return NextResponse.json({ refunds: [], error: err?.message ?? 'Refund queue unavailable.' })
  }
}
