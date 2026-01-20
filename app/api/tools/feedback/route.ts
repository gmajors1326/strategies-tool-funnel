import { NextResponse } from 'next/server'
import { createToolFeedback, listToolFeedback } from '@/src/lib/tool/feedback'
import { getBonusRunGrantExists, getBonusRunsSummary, grantBonusRuns } from '@/src/lib/tool/bonusRuns'

async function getAuthedUserId(req: Request): Promise<string> {
  const devHeader = req.headers.get('x-user-id')
  if (process.env.NODE_ENV === 'development' && devHeader) return devHeader
  throw new Error('Unauthorized: missing auth integration for getAuthedUserId()')
}

const computeGrantedRuns = (length: number) => {
  if (length >= 320) return 3
  if (length >= 220) return 2
  return 1
}

export async function POST(req: Request) {
  try {
    const userId = await getAuthedUserId(req)
    const body = await req.json()

    const toolId = String(body.toolId || '')
    const runId = body.runId ? String(body.runId) : null
    const message = body.message != null ? String(body.message).slice(0, 2000) : null
    const goal = body.goal != null ? String(body.goal).slice(0, 500) : null

    const thumbs = body.thumbs === 'up' || body.thumbs === 'down' ? body.thumbs : null
    const rating = body.rating == null ? null : Number.isFinite(Number(body.rating)) ? Number(body.rating) : null
    const tags = Array.isArray(body.tags) ? body.tags.map((t: any) => String(t)).slice(0, 25) : null

    if (!toolId) {
      return NextResponse.json({ error: { message: 'toolId is required' } }, { status: 400 })
    }
    if (!message || message.trim().length < 120) {
      return NextResponse.json({ error: { message: 'message must be at least 120 characters' } }, { status: 400 })
    }

    const existing = await listToolFeedback({ userId, toolId, limit: 1 })
    if (existing.length > 0) {
      return NextResponse.json({ error: { message: 'Feedback already submitted for this tool.' } }, { status: 429 })
    }

    const comment = goal ? `Goal: ${goal}\n\n${message}` : message

    const row = await createToolFeedback({
      userId,
      toolId,
      runId,
      thumbs,
      rating,
      tags,
      comment,
    })

    if (!(await getBonusRunGrantExists({ userId, toolId }))) {
      await grantBonusRuns({
        userId,
        toolId,
        runsGranted: computeGrantedRuns(comment.length),
        reason: 'feedback',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        grantedBy: 'system',
      })
    }

    const summary = await getBonusRunsSummary({ userId, toolId })

    return NextResponse.json({
      ok: true,
      feedback: row,
      grantedRuns: summary.grantedRuns,
      bonusRunsRemaining: summary.remainingRuns,
      expiresAt: summary.expiresAt,
    })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: { message: err?.message || 'Unknown error' } },
      { status: err?.message?.includes('Unauthorized') ? 401 : 500 }
    )
  }
}
