import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireUser } from '@/src/lib/auth/requireUser'
import { getMockTicketDetail } from '@/src/lib/mock/data'

const replySchema = z.object({
  message: z.string(),
})

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { ticketId: string } }
) {
  await requireUser()
  const body = await request.json()
  replySchema.parse(body)
  // TODO: replace (ui): append reply to persisted support thread.
  const detail = await getMockTicketDetail(params.ticketId)

  return NextResponse.json({
    ...detail,
    thread: [
      ...detail.thread,
      {
        // TODO: replace (ui): generate message IDs from persistence layer.
        id: `msg_${Math.random().toString(36).slice(2, 7)}`,
        author: 'user',
        message: body.message,
        createdAtISO: new Date().toISOString(),
      },
    ],
  })
}
