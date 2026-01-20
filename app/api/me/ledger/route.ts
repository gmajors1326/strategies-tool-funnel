import { NextRequest, NextResponse } from 'next/server'
import { listLedgerEntries } from '@/src/lib/tokens/ledger'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || '50')
  const userId = 'user_dev_1'
  const entries = await listLedgerEntries(userId, limit)
  return NextResponse.json({ entries })
}
