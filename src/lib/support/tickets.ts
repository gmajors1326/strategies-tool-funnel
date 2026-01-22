import { prisma } from '@/src/lib/prisma'

export type TicketSummary = {
  id: string
  subject: string
  status: string
  category: string
  createdAtISO: string
  createdAt: string
}

export type TicketThreadMessage = {
  id: string
  author: string
  message: string
  createdAtISO: string
}

export type TicketDetail = {
  id: string
  subject: string
  status: string
  category: string
  createdAtISO: string
  thread: TicketThreadMessage[]
}

export type TicketUserContext = {
  userId: string
  email: string | null
  planId: string | null
}

const toAuthorLabel = (role: string | null | undefined) => {
  if (!role) return 'unknown'
  if (role === 'admin') return 'admin'
  if (role === 'support') return 'support'
  return 'user'
}

export const listTicketsForUser = async (userId: string): Promise<TicketSummary[]> => {
  const rows = await prisma.supportTicket.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    status: row.status,
    category: row.category,
    createdAtISO: row.createdAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }))
}

export const listTicketsForAdmin = async (): Promise<TicketSummary[]> => {
  const rows = await prisma.supportTicket.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return rows.map((row) => ({
    id: row.id,
    subject: row.subject,
    status: row.status,
    category: row.category,
    createdAtISO: row.createdAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  }))
}

export const getTicketDetailForUser = async (userId: string, ticketId: string): Promise<TicketDetail | null> => {
  const row = await prisma.supportTicket.findFirst({
    where: { id: ticketId, userId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!row) return null

  return {
    id: row.id,
    subject: row.subject,
    status: row.status,
    category: row.category,
    createdAtISO: row.createdAt.toISOString(),
    thread: row.messages.map((message) => ({
      id: message.id,
      author: toAuthorLabel(message.authorRole),
      message: message.message,
      createdAtISO: message.createdAt.toISOString(),
    })),
  }
}

export const getTicketDetailForAdmin = async (
  ticketId: string
): Promise<{ ticket: TicketDetail; userContext: TicketUserContext } | null> => {
  const row = await prisma.supportTicket.findFirst({
    where: { id: ticketId },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      user: { select: { id: true, email: true, plan: true } },
    },
  })

  if (!row) return null

  return {
    ticket: {
      id: row.id,
      subject: row.subject,
      status: row.status,
      category: row.category,
      createdAtISO: row.createdAt.toISOString(),
      thread: row.messages.map((message) => ({
        id: message.id,
        author: toAuthorLabel(message.authorRole),
        message: message.message,
        createdAtISO: message.createdAt.toISOString(),
      })),
    },
    userContext: {
      userId: row.user.id,
      email: row.user.email ?? null,
      planId: row.user.plan?.toString?.() ?? null,
    },
  }
}

export const createTicketForUser = async (params: {
  userId: string
  category: string
  subject?: string | null
  message?: string | null
}) => {
  const subject =
    params.subject?.trim() ||
    `${params.category} support request`

  const created = await prisma.$transaction(async (tx) => {
    const ticket = await tx.supportTicket.create({
      data: {
        userId: params.userId,
        category: params.category,
        subject,
      },
    })

    if (params.message?.trim()) {
      await tx.supportMessage.create({
        data: {
          ticketId: ticket.id,
          authorRole: 'user',
          authorId: params.userId,
          message: params.message.trim(),
        },
      })
    }

    return ticket
  })

  return {
    ticketId: created.id,
    status: created.status,
    category: created.category,
    subject: created.subject,
  }
}

export const addReplyForUser = async (params: { userId: string; ticketId: string; message: string }) => {
  const ticket = await prisma.supportTicket.findFirst({
    where: { id: params.ticketId, userId: params.userId },
  })

  if (!ticket) return null

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      authorRole: 'user',
      authorId: params.userId,
      message: params.message.trim(),
    },
  })

  return getTicketDetailForUser(params.userId, params.ticketId)
}
