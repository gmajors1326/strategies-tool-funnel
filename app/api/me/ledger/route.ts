// app/api/me/ledger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { listLedgerEntries } from '@/src/lib/tokens/ledger'
import { requireUser } from '@/src/lib/auth/requireUser'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200)

  // Optional: admin can fetch another user's ledger by passing ?userId=
  const requestedUserId = searchParams.get('userId')

  let userId: string

  if (requestedUserId) {
    // Admin-only path
    await requireAdmin()
    userId = requestedUserId
  } else {
    // Normal user path
    const session = await requireUser()
    userId = session.id
  }

  const entries = await listLedgerEntries(userId, limit)

  return NextResponse.json({ entries })
}
