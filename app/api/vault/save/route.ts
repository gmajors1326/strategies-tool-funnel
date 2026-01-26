import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import { VaultItemKind } from '@/src/generated/prisma/client'

export async function POST(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canSaveToVault) {
      return NextResponse.json({ error: 'Vault is a paid feature.', errorCode: 'PLAN_REQUIRED' }, { status: 403 })
    }

    const body = (await req.json()) as { toolId?: string; runId?: string; title?: string }
    if (!body?.runId) {
      return NextResponse.json({ error: 'Missing runId.' }, { status: 400 })
    }

    const run = await prisma.toolRun.findFirst({
      where: { id: body.runId, userId: user.id },
    })

    if (!run) {
      return NextResponse.json({ error: 'Run not found.' }, { status: 404 })
    }

    const toolSlug = run.toolSlug || body.toolId || 'tool'
    const title = body.title?.trim() || `Run snapshot: ${toolSlug} (${new Date().toLocaleDateString()})`

    const item = await prisma.vaultItem.create({
      data: {
        userId: user.id,
        toolSlug,
        kind: VaultItemKind.RUN_SNAPSHOT,
        title,
        body: {
          runId: run.id,
          input: run.input ?? run.inputsJson ?? {},
          output: run.output ?? run.outputsJson ?? {},
          savedAt: new Date().toISOString(),
        },
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ vaultItemId: item.id, createdAt: item.createdAt.toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Save failed.' }, { status: 500 })
  }
}
