import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { getMockRefunds } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  // TODO: replace (billing): load refund queue from billing system.
  return NextResponse.json({ refunds: await getMockRefunds() })
}
