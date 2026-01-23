import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)
    const { searchParams } = new URL(req.url)
    const toolId = searchParams.get('toolId')
    if (!toolId) return NextResponse.json({ error: 'Missing toolId.' }, { status: 400 })

    const limit = ent.canSeeHistory ? 20 : 3
    const rows = await prisma.toolRunLog.findMany({
      where: { userId: user.id, toolId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        runId: true,
        createdAt: true,
        inputSummary: true,
        status: true,
      },
    })

    return NextResponse.json({
      runs: rows.map((row) => ({
        runId: row.runId,
        createdAt: row.createdAt.toISOString(),
        inputSummary: row.inputSummary || '',
        status: row.status,
      })),
      limit,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load runs.' }, { status: 500 })
  }
}
