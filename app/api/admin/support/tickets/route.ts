import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { listTicketsForAdmin } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  const tickets = await listTicketsForAdmin()
  return NextResponse.json({ tickets })
}
