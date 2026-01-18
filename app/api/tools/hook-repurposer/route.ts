import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/entitlements'
import { runHookRepurposer, type HookRepurposerInputs } from '@/lib/tools/hook-repurposer'
import type { Prisma } from '@prisma/client'
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
    const inputs = hookSchema.parse(body) as HookRepurposerInputs & { save?: boolean }

    const session = await getSession()
    const entitlements = session ? await getUserEntitlements(session.userId) : null

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

    const outputs = runHookRepurposer(inputs)

    let saved = false
    if (session && inputs.save) {
      if (entitlements?.canSaveRuns && entitlements.freeRunsRemaining > 0) {
        await prisma.toolRun.create({
          data: {
            userId: session.userId,
            toolKey: 'hook-repurposer',
            inputsJson: inputs as unknown as Prisma.InputJsonValue,
            outputsJson: outputs as unknown as Prisma.InputJsonValue,
          },
        })

        if (session.plan === 'FREE') {
          await prisma.user.update({
            where: { id: session.userId },
            data: {
              freeVerifiedRunsRemaining: {
                decrement: 1,
              },
            },
          })
        }

        saved = true
      }
    }

    const response = NextResponse.json({
      success: true,
      outputs,
      saved,
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

    console.error('Hook repurposer error:', error)
    return NextResponse.json(
      { error: 'Failed to repurpose hook' },
      { status: 500 }
    )
  }
}
