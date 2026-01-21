import { NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getMockTicketDetail } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: { ticketId: string } }
) {
  await requireUser()
  // TODO: replace (ui): load ticket detail from support backend.
  return NextResponse.json(await getMockTicketDetail(params.ticketId))
}
