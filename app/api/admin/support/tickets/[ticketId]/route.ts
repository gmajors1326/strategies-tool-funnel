import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getTicketDetailForAdmin } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { ticketId: string } }
) {
  await requireAdmin()
  const detail = await getTicketDetailForAdmin(params.ticketId)
  if (!detail) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  return NextResponse.json(detail)
}
