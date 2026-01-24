import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const { searchParams } = new URL(req.url)
    const runId = searchParams.get('runId')
    if (!runId) return NextResponse.json({ error: 'Missing runId.' }, { status: 400 })

    const run = await prisma.toolRun.findFirst({
      where: { id: runId, userId: user.id },
      select: { id: true, toolSlug: true, input: true, output: true, createdAt: true },
    })

    if (!run) return NextResponse.json({ error: 'Run not found.' }, { status: 404 })

    return NextResponse.json({
      runId: run.id,
      toolSlug: run.toolSlug,
      input: run.input ?? {},
      output: run.output ?? {},
      createdAt: run.createdAt.toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load run.' }, { status: 500 })
  }
}
