import { NextRequest, NextResponse } from 'next/server'
import { executeTool } from '@/lib/tool-execution'
import { getSession } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/entitlements'
import { logger } from '@/lib/logger'
import { captureException } from '@/lib/sentry'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const MAX_HOOK_LENGTH = 200
const MAX_CONTEXT_LENGTH = 140
const DAILY_LIMIT = 2

const hookSchema = z.object({
  hookInput: z.string().min(8).max(MAX_HOOK_LENGTH),
  videoContext: z.string().max(MAX_CONTEXT_LENGTH).optional(),
  goal: z.enum([
    'Stop the scroll',
    'Spark curiosity',
    'Authority/credibility',
    'Drive comments',
    'Drive profile clicks',
  ]).optional(),
  tone: z.enum(['Calm', 'Direct', 'Curious', 'Bold']).optional(),
  platformFocus: z.enum(['Reels', 'TikTok', 'Shorts']).optional(),
  save: z.boolean().optional(),
})

function getUsageCookieValue(cookie?: string) {
  if (!cookie) return { date: '', count: 0 }
  const [date, count] = cookie.split(':')
  return { date, count: Number(count || 0) }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const inputs = hookSchema.parse(body)

    const session = await getSession()
    const entitlements = session ? await getUserEntitlements(session.userId) : null

    // Anonymous rate limiting (keep existing logic)
    const usageCookie = request.cookies.get('hook-repurposer-usage')?.value
    const today = new Date().toISOString().split('T')[0]
    const { date, count } = getUsageCookieValue(usageCookie)
    const dailyCount = date === today ? count : 0

    const shouldLimit =
      !entitlements || (!entitlements.dmEngine && !entitlements.strategy && !entitlements.allAccess)

    if (shouldLimit && dailyCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: 'Daily limit reached. Try again tomorrow.' },
        { status: 429 }
      )
    }

    // Execute tool with AI (required)
    const result = await executeTool({
      toolKey: 'hook-repurposer',
      inputs: {
        original_hook: inputs.hookInput,
        topic_optional: inputs.videoContext,
        max_words: 12,
        tone: inputs.tone?.toLowerCase() || 'neutral',
      },
      userText: inputs.videoContext,
      style: 'strategist', // Hook repurposer uses strategist style
      save: inputs.save,
    })

    const response = NextResponse.json({
      success: true,
      outputs: result.outputs,
      saved: result.saved,
      aiUsageRemaining: result.aiUsageRemaining,
      remainingToday: shouldLimit ? Math.max(0, DAILY_LIMIT - (dailyCount + 1)) : null,
    })

    if (shouldLimit) {
      response.cookies.set('hook-repurposer-usage', `${today}:${dailyCount + 1}`, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24,
        path: '/',
      })
    }

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    logger.error('Hook repurposer error', error as Error, {
      toolKey: 'hook-repurposer',
    })

    if (error instanceof Error) {
      captureException(error, {
        toolKey: 'hook-repurposer',
      })
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to repurpose hook' },
      { status: 500 }
    )
  }
}
