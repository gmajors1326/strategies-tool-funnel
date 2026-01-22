import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import type { RunRequest } from '@/src/lib/tools/runTypes'
import { runnerRegistry } from '@/src/lib/tools/runnerRegistry'
import { toolMetaRegistry } from '@/src/lib/tools/toolMetaRegistry'

export async function POST(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    const body = (await req.json()) as {
      toolId?: string
      toolSlug?: string
      input?: any
    }

    const toolKey = body.toolSlug || body.toolId
    if (!toolKey) {
      return NextResponse.json({ error: 'Missing tool id/slug.' }, { status: 400 })
    }

    const runner = (runnerRegistry as any)[toolKey]
    if (!runner) {
      return NextResponse.json({ error: `No runner found for ${toolKey}` }, { status: 404 })
    }

    const toolMeta =
      (toolMetaRegistry as any)[toolKey] ??
      (toolMetaRegistry as any)[body.toolId ?? ''] ??
      null

    const runReq: RunRequest = {
      toolId: body.toolId ?? toolKey,
      input: body.input ?? {},
      mode: 'paid',
    } as RunRequest

    const ctx = {
      user,
      toolMeta,
      usage: { aiTokensRemaining: 999999 },
      logger: {
        info: (_msg: string, _meta?: any) => {},
        error: (_msg: string, _meta?: any) => {},
      },
    }

    const t0 = Date.now()
    const out = await runner(runReq, ctx as any)
    const latencyMs = Date.now() - t0

    const output = out?.output ?? out

    const toolId = body.toolId ?? (typeof toolKey === 'string' ? toolKey : 'unknown')
    const toolSlug = body.toolSlug ?? (typeof toolKey === 'string' ? toolKey : 'unknown')

    await prisma.toolRun.create({
      data: {
        userId: user.id,
        toolId,
        toolSlug,
        input: runReq.input ?? {},
        output,
        toolKey: toolId,
        inputsJson: runReq.input ?? {},
        outputsJson: output,
      },
    })

    return NextResponse.json({
      output,
      meta: { latencyMs },
      entitlements: ent,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Run failed.' }, { status: 500 })
  }
}
