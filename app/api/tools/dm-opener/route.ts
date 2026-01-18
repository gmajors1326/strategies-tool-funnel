import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/entitlements'
import { prisma } from '@/lib/db'
import { generateDMOpener, type DMOpenerInputs } from '@/lib/tools/dm-opener'
import { z } from 'zod'
import type { Prisma } from '@prisma/client'

const openerSchema = z.object({
  scenario: z.enum(['commenter', 'story reply', 'inbound DM', 'warm lead', 'cold-ish lead']),
  tone: z.enum(['friendly', 'direct', 'playful', 'professional']),
  intent: z.enum(['start convo', 'qualify', 'soft invite', 'book call']),
  save: z.boolean().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const inputs = openerSchema.parse(body)

    // Run DM opener generator (free tool, always available)
    const outputs = generateDMOpener(inputs)

    // Save if user is verified and has remaining runs
    const session = await getSession()
    let saved = false

    if (session && inputs.save) {
      const entitlements = await getUserEntitlements(session.userId)

      if (entitlements.canSaveRuns && entitlements.freeRunsRemaining > 0) {
        await prisma.toolRun.create({
          data: {
            userId: session.userId,
            toolKey: 'dm-opener',
            inputsJson: inputs as Prisma.InputJsonValue,
            outputsJson: outputs as Prisma.InputJsonValue,
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

    console.error('DM opener error:', error)
    return NextResponse.json(
      { error: 'Failed to generate opener' },
      { status: 500 }
    )
  }
}
