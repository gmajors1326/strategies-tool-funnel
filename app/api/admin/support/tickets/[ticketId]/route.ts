import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { getMockTicketDetail } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { ticketId: string } }
) {
  await requireAdmin()
  return NextResponse.json({
    ...getMockTicketDetail(params.ticketId),
    userContext: {
      userId: 'user_dev_1',
      email: 'dev@example.com',
      planId: 'pro_monthly',
      lifetimeValue: 129,
    },
  })
}
