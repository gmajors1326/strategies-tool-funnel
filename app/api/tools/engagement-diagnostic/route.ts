import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/entitlements'
import { prisma } from '@/lib/db'
import { runEngagementDiagnostic, type EngagementDiagnosticInputs } from '@/lib/tools/engagement-diagnostic'
import { z } from 'zod'

const diagnosticSchema = z.object({
  followerRange: z.enum(['0-500', '500-2k', '2k-10k', '10k+']),
  postingFrequency: z.enum(['rarely', '1-2x/week', '3-5x/week', 'daily-ish']),
  dailyEngagementTime: z.enum(['0-5', '5-15', '15-30', '30+']),
  primaryGoal: z.enum(['growth', 'DMs', 'sales', 'authority']),
  biggestFriction: z.enum(['no reach', 'low engagement', 'no DMs', 'no sales', 'burnout']),
  save: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const inputs = diagnosticSchema.parse(body)

    // Run diagnostic (free tool, always available)
    const outputs = runEngagementDiagnostic(inputs)

    // Save if user is verified and has remaining runs
    const session = await getSession()
    let saved = false

    if (session && inputs.save) {
      const entitlements = await getUserEntitlements(session.userId)

      if (entitlements.canSaveRuns && entitlements.freeRunsRemaining > 0) {
        await prisma.toolRun.create({
          data: {
            userId: session.userId,
            toolKey: 'engagement-diagnostic',
            inputsJson: inputs,
            outputsJson: outputs,
          },
        })

        // Decrement free runs if not paid
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

    return NextResponse.json({
      success: true,
      outputs,
      saved,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Engagement diagnostic error:', error)
    return NextResponse.json(
      { error: 'Failed to run diagnostic' },
      { status: 500 }
    )
  }
}
