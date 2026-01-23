import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canExport) {
      return NextResponse.json({ error: 'Export is a paid feature.', errorCode: 'PLAN_REQUIRED' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const runId = searchParams.get('runId')
    if (!runId) {
      return NextResponse.json({ error: 'Missing runId.' }, { status: 400 })
    }

    const run = await prisma.toolRun.findFirst({
      where: { id: runId, userId: user.id },
      select: { toolSlug: true, output: true, outputsJson: true, createdAt: true },
    })
    if (!run) {
      return NextResponse.json({ error: 'Run not found.' }, { status: 404 })
    }

    const payload = run.output ?? run.outputsJson ?? {}
    const filename = `${run.toolSlug || 'tool'}-${runId}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed.' }, { status: 500 })
  }
}
