import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { getMockTicketDetail } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { ticketId: string } }
) {
  await requireAdmin()
  // TODO: replace (ui): load admin ticket detail + user context from support system.
  return NextResponse.json({
    ...getMockTicketDetail(params.ticketId),
    // TODO: replace (ui): load user context from support/billing systems.
    userContext: {
      userId: 'user_dev_1',
      email: 'dev@example.com',
      planId: 'pro_monthly',
      lifetimeValue: 129,
    },
  })
}
