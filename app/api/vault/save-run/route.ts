import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import { VaultItemKind } from '@prisma/client'

export async function POST(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canSaveToVault) {
      return NextResponse.json({ error: 'Vault is a paid feature.' }, { status: 403 })
    }

    const body = (await req.json()) as {
      toolSlug: string
      title?: string
      input: any
      output: any
    }

    if (!body?.toolSlug) {
      return NextResponse.json({ error: 'Missing toolSlug.' }, { status: 400 })
    }

    const title = body.title?.trim() || `Run snapshot: ${body.toolSlug} (${new Date().toLocaleDateString()})`

    const item = await prisma.vaultItem.create({
      data: {
        userId: user.id,
        toolSlug: body.toolSlug,
        kind: VaultItemKind.RUN_SNAPSHOT,
        title,
        body: {
          input: body.input ?? {},
          output: body.output ?? {},
          savedAt: new Date().toISOString(),
        },
      },
      select: { id: true, createdAt: true },
    })

    return NextResponse.json({ ok: true, id: item.id, at: item.createdAt.toISOString() })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Save failed.' }, { status: 500 })
  }
}
