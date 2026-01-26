import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { getTicketDetailForAdmin } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const { ticketId } = await params
  await requireAdminAccess(request, {
    action: 'admin.support.ticket.get',
    policy: 'support',
    target: ticketId,
  })
  const detail = await getTicketDetailForAdmin(ticketId)
  if (!detail) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }
  return NextResponse.json(detail)
}
