import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canSeeHistory) {
      return NextResponse.json({ error: 'History is a paid feature.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const toolSlug = searchParams.get('toolSlug')
    if (!toolSlug) {
      return NextResponse.json({ error: 'Missing toolSlug.' }, { status: 400 })
    }

    const runs = await prisma.toolRun.findMany({
      where: { userId: user.id, toolSlug },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        createdAt: true,
        input: true,
        output: true,
      },
    })

    return NextResponse.json({
      runs: runs.map((r) => ({
        id: r.id,
        at: r.createdAt.toISOString(),
        input: r.input,
        output: r.output,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load history.' }, { status: 500 })
  }
}
