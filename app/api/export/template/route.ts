import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'

type ExportKind = 'template' | 'checklist'

function toChecklist(output: any) {
  return {
    version: 1,
    type: 'checklist',
    items: [
      { text: 'Hook pattern break in first 1s', done: false },
      { text: 'One idea only', done: false },
      { text: 'Visual loop ending matches opening', done: false },
      { text: 'CTA is save/follow/DM (soft)', done: false },
      { text: "Caption reinforces, doesn't repeat", done: false },
    ],
    source: output ?? {},
  }
}

function toTemplate(output: any) {
  return {
    version: 1,
    type: 'template',
    fields: [
      { key: 'hook', label: 'Hook (1-1.5s)', value: '' },
      { key: 'idea', label: 'One clear idea', value: '' },
      { key: 'beats', label: 'Beats (3-5 lines)', value: [] },
      { key: 'cta', label: 'CTA (soft)', value: 'Save this' },
      { key: 'caption', label: 'Caption', value: '' },
    ],
    source: output ?? {},
  }
}

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canExportTemplates) {
      return NextResponse.json({ error: 'Template exports are a paid feature.' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const runId = searchParams.get('runId')
    const kind = searchParams.get('kind') as ExportKind

    if (!runId) return NextResponse.json({ error: 'Missing runId.' }, { status: 400 })
    if (!kind) return NextResponse.json({ error: 'Missing kind.' }, { status: 400 })

    const run = await prisma.toolRun.findFirst({
      where: { id: runId, userId: user.id },
      select: { toolSlug: true, input: true, inputsJson: true, output: true, outputsJson: true, createdAt: true },
    })

    if (!run) {
      return NextResponse.json({ error: 'Run not found.' }, { status: 404 })
    }

    const output = run.output ?? run.outputsJson ?? {}
    const payload = kind === 'checklist' ? toChecklist(output) : toTemplate(output)
    const filename = `${run.toolSlug || 'tool'}-${kind}.json`

    return new NextResponse(
      JSON.stringify(
        {
          toolId: run.toolSlug,
          name: `Preset - ${run.toolSlug || 'tool'}`,
          input: run.input ?? run.inputsJson ?? {},
          createdAt: run.createdAt.toISOString(),
          payload,
        },
        null,
        2
      ),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed.' }, { status: 500 })
  }
}
