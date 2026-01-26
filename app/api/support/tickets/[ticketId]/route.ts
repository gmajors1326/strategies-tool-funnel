import { NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getTicketDetailForUser } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const session = await requireUser()
  const { ticketId } = await params
  const ticket = await getTicketDetailForUser(session.id, ticketId)
  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  return NextResponse.json(ticket)
}
