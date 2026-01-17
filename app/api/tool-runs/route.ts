import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const toolRuns = await prisma.toolRun.findMany({
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
    })

    return NextResponse.json({ toolRuns })
  } catch (error) {
    console.error('Tool runs fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool runs' },
      { status: 500 }
    )
  }
}
