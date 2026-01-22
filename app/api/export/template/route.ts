import { NextResponse } from 'next/server'
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

export async function POST(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canExportTemplates) {
      return NextResponse.json({ error: 'Template exports are a paid feature.' }, { status: 403 })
    }

    const body = (await req.json()) as {
      toolSlug: string
      kind: ExportKind
      output: any
    }

    if (!body?.toolSlug) return NextResponse.json({ error: 'Missing toolSlug.' }, { status: 400 })
    if (!body?.kind) return NextResponse.json({ error: 'Missing kind.' }, { status: 400 })

    const payload = body.kind === 'checklist' ? toChecklist(body.output) : toTemplate(body.output)

    return NextResponse.json({ ok: true, kind: body.kind, payload })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed.' }, { status: 500 })
  }
}
