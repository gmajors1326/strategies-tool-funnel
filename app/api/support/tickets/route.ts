import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getMockTickets } from '@/src/lib/mock/data'

const createTicketSchema = z.object({
  category: z.string(),
  message: z.string().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireUser()
  return NextResponse.json({ tickets: getMockTickets() })
}

export async function POST(request: NextRequest) {
  const user = await requireUser()
  const body = await request.json()
  const { category } = createTicketSchema.parse(body)
  const ticketId = `tkt_${Math.random().toString(36).slice(2, 7)}`

  return NextResponse.json({
    ticketId,
    status: 'open',
    category,
    metadata: {
      userId: user.id,
      planId: user.planId,
      toolId: null,
      requestId: `req_${Math.random().toString(36).slice(2, 9)}`,
    },
  })
}
