import { prisma } from '@/src/lib/prisma'

export type ToolFeedbackInput = {
  userId: string
  toolId: string
  runId?: string | null
  thumbs?: 'up' | 'down' | null
  rating?: number | null
  tags?: string[] | null
  comment?: string | null
}

export async function createToolFeedback(input: ToolFeedbackInput) {
  const {
    userId,
    toolId,
    runId = null,
    thumbs = null,
    rating = null,
    tags = null,
    comment = null,
  } = input

  if (!userId || !toolId) throw new Error('userId and toolId are required.')

  if (rating != null) {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('rating must be an integer 1..5')
    }
  }

  if (thumbs != null && thumbs !== 'up' && thumbs !== 'down') {
    throw new Error("thumbs must be 'up' or 'down'")
  }

  const row = await prisma.toolFeedback.create({
    data: {
      user_id: userId,
      tool_id: toolId,
      run_id: runId,
      thumbs,
      rating,
      tags: tags ? tags : undefined,
      comment: comment ? comment : undefined,
    },
    select: {
      id: true,
      user_id: true,
      tool_id: true,
      run_id: true,
      thumbs: true,
      rating: true,
      tags: true,
      comment: true,
      created_at: true,
    },
  })

  return row
}

export async function listToolFeedback(params: {
  userId?: string
  limit?: number
  toolId?: string
}) {
  const { userId, limit = 50, toolId } = params

  const rows = await prisma.toolFeedback.findMany({
    where: { ...(userId ? { user_id: userId } : {}), ...(toolId ? { tool_id: toolId } : {}) },
    orderBy: { created_at: 'desc' },
    take: Math.max(1, Math.min(limit, 200)),
    select: {
      id: true,
      user_id: true,
      tool_id: true,
      run_id: true,
      thumbs: true,
      rating: true,
      tags: true,
      comment: true,
      created_at: true,
    },
  })

  return rows
}
