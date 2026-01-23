import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'

function flattenObject(input: any, prefix = ''): Record<string, string> {
  if (!input || typeof input !== 'object') {
    return { [prefix || 'value']: String(input ?? '') }
  }
  return Object.entries(input).reduce<Record<string, string>>((acc, [key, value]) => {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (Array.isArray(value)) {
      if (value.every((v) => typeof v !== 'object' || v === null)) {
        acc[nextKey] = value.map((v) => String(v)).join('; ')
      } else {
        acc[nextKey] = JSON.stringify(value)
      }
      return acc
    }
    if (value && typeof value === 'object') {
      Object.assign(acc, flattenObject(value, nextKey))
      return acc
    }
    acc[nextKey] = String(value ?? '')
    return acc
  }, {})
}

function findPrimaryTable(output: any): Array<Record<string, any>> | null {
  if (!output || typeof output !== 'object') return null
  for (const value of Object.values(output)) {
    if (Array.isArray(value) && value.length && value.every((v) => v && typeof v === 'object')) {
      return value as Array<Record<string, any>>
    }
  }
  return null
}

function toCsv(rows: Array<Record<string, any>>) {
  const flattened = rows.map((row) => flattenObject(row))
  const headers = Array.from(new Set(flattened.flatMap((row) => Object.keys(row))))
  const escape = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return val
  }
  const lines = [
    headers.map((h) => escape(h)).join(','),
    ...flattened.map((row) => headers.map((h) => escape(row[h] ?? '')).join(',')),
  ]
  return lines.join('\n')
}

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
      select: { toolSlug: true, output: true, outputsJson: true },
    })
    if (!run) {
      return NextResponse.json({ error: 'Run not found.' }, { status: 404 })
    }

    const payload = run.output ?? run.outputsJson ?? {}
    const table = findPrimaryTable(payload) ?? [payload]
    const csv = toCsv(table)
    const filename = `${run.toolSlug || 'tool'}-${runId}.csv`

    try {
      await prisma.exportEvent.create({
        data: {
          userId: user.id,
          toolId: run.toolSlug || undefined,
          runId,
          type: 'csv',
        },
      })
    } catch {
      // ignore logging failures
    }

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed.' }, { status: 500 })
  }
}
