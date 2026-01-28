import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/src/lib/auth/requireUser'
import { createTicketForUser, listTicketsForUser } from '@/src/lib/support/tickets'
import { sendSupportTicketNotification } from '@/lib/email'

const createTicketSchema = z.object({
  category: z.string(),
  subject: z.string().optional(),
  message: z.string().optional(),
})

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await requireUser()
  const tickets = await listTicketsForUser(session.id)
  return NextResponse.json({ tickets })
}

export async function POST(request: NextRequest) {
  const user = await requireUser()
  const body = await request.json()
  const { category, subject, message } = createTicketSchema.parse(body)

  const created = await createTicketForUser({
    userId: user.id,
    category,
    subject,
    message,
  })

  await sendSupportTicketNotification({
    ticketId: created.ticketId,
    category: created.category,
    subject: created.subject,
    message,
    userId: user.id,
    planId: user.planId,
  })

  return NextResponse.json({
    ticketId: created.ticketId,
    status: created.status,
    category: created.category,
    subject: created.subject,
    metadata: {
      userId: user.id,
      planId: user.planId,
      toolId: null,
    },
  })
}
