import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { getUserEntitlements } from '@/lib/entitlements'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { toolRuns: [], entitlements: null },
        { status: 200 }
      )
    }

    const [toolRuns, entitlements] = await Promise.all([
      prisma.toolRun.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        select: {
          id: true,
          toolKey: true,
          inputsJson: true,
          outputsJson: true,
          createdAt: true,
        },
      }),
      getUserEntitlements(session.userId),
    ])

    return NextResponse.json({ toolRuns, entitlements })
  } catch (error) {
    console.error('Tool runs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool runs', toolRuns: [], entitlements: null },
      { status: 500 }
    )
  }
}
