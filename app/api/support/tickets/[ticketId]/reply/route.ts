import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/src/lib/auth/requireUser'
import { addReplyForUser } from '@/src/lib/support/tickets'

const replySchema = z.object({
  message: z.string(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  const session = await requireUser()
  const body = await request.json()
  const { message } = replySchema.parse(body)
  const detail = await addReplyForUser({
    userId: session.id,
    ticketId: params.ticketId,
    message,
  })

  if (!detail) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  return NextResponse.json(detail)
}
