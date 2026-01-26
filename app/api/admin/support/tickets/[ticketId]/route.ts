import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { getTicketDetailForAdmin } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  await requireAdmin()
  const { ticketId } = await params
  const detail = await getTicketDetailForAdmin(ticketId)
  if (!detail) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  return NextResponse.json(detail)
}
