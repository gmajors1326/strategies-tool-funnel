import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import { jsPDF } from 'jspdf'

const EMPTY_PLACEHOLDER = 'Needs more input.'

function addSection(doc: jsPDF, title: string, body: string, y: number) {
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title, 40, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(body, 520)
  doc.text(lines, 40, y + 16)
  return y + 16 + lines.length * 12 + 12
}

function titleFromKey(key: string) {
  const withSpaces = key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
  return withSpaces
    .split(' ')
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join(' ')
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return EMPTY_PLACEHOLDER
  if (typeof value === 'string') return value.trim() || EMPTY_PLACEHOLDER
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    if (!value.length) return EMPTY_PLACEHOLDER
    return value.map((item) => `- ${formatValue(item)}`).join('\n')
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (!entries.length) return EMPTY_PLACEHOLDER
    return entries.map(([k, v]) => `${titleFromKey(k)}: ${formatValue(v)}`).join('\n')
  }
  return String(value)
}

function buildSummaryLines(output: any) {
  const lines: Array<{ label: string; value: any }> = []
  const summary = output?.summary
  if (typeof summary === 'string') {
    lines.push({ label: 'Summary', value: summary })
    return lines
  }
  if (summary && typeof summary === 'object') {
    const primary = summary?.primaryIssue || summary?.oneSentenceDiagnosis
    if (primary) lines.push({ label: 'Primary issue', value: primary })
    if (summary?.confidence !== undefined) lines.push({ label: 'Confidence', value: summary.confidence })
    if (!lines.length) {
      Object.entries(summary)
        .filter(([, v]) => v !== null && v !== undefined && ['string', 'number', 'boolean'].includes(typeof v))
        .slice(0, 3)
        .forEach(([k, v]) => lines.push({ label: k, value: v }))
    }
    return lines
  }
  if (output?.score && typeof output.score === 'object') {
    Object.entries(output.score)
      .filter(([, v]) => typeof v === 'number')
      .slice(0, 3)
      .forEach(([k, v]) => lines.push({ label: k, value: v }))
  }
  if (!lines.length && Array.isArray(output?.angles) && output.angles[0]) {
    lines.push({ label: 'Top angle', value: output.angles[0].angle || output.angles[0].hook })
  }
  if (!lines.length && Array.isArray(output?.rewrites) && output.rewrites[0]) {
    lines.push({ label: 'Top rewrite', value: output.rewrites[0].cta || output.rewrites[0].hook })
  }
  if (!lines.length && Array.isArray(output?.signals) && output.signals[0]) {
    lines.push({ label: 'Top signal', value: output.signals[0].signal })
  }
  if (!lines.length) {
    Object.entries(output || {})
      .filter(([, v]) => v !== null && v !== undefined && ['string', 'number', 'boolean'].includes(typeof v))
      .slice(0, 3)
      .forEach(([k, v]) => lines.push({ label: k, value: v }))
  }
  return lines
}

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canExport) {
      return NextResponse.json({ error: 'PDF export is a paid feature.', errorCode: 'PLAN_REQUIRED' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const runId = searchParams.get('runId')
    if (!runId) {
      return NextResponse.json({ error: 'Missing runId.' }, { status: 400 })
    }

    const run = await prisma.toolRun.findFirst({
      where: { id: runId, userId: user.id },
      select: {
        toolSlug: true,
        input: true,
        inputsJson: true,
        output: true,
        outputsJson: true,
        createdAt: true,
      },
    })
    if (!run) {
      return NextResponse.json({ error: 'Run not found.' }, { status: 404 })
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' })
    const toolName = run.toolSlug || 'Tool'
    const createdAt = run.createdAt.toISOString()
    const input = run.input ?? run.inputsJson ?? {}
    const output = run.output ?? run.outputsJson ?? {}

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${toolName} Report`, 40, 40)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Run ID: ${runId}`, 40, 58)
    doc.text(`Created: ${createdAt}`, 40, 72)

    let y = 100
    y = addSection(doc, 'Inputs', JSON.stringify(input, null, 2), y)

    const summaryLines = buildSummaryLines(output)
    if (summaryLines.length) {
      const summaryText = summaryLines.map((line) => `${titleFromKey(line.label)}: ${formatValue(line.value)}`).join('\n')
      y = addSection(doc, 'Summary', summaryText, y)
    }

    if (output && typeof output === 'object') {
      const entries = Object.entries(output).filter(([key]) => key !== 'summary')
      for (const [key, value] of entries) {
        y = addSection(doc, titleFromKey(key), formatValue(value), y)
      }
    } else {
      y = addSection(doc, 'Output', formatValue(output), y)
    }

    const pdfBuffer = doc.output('arraybuffer')
    const filename = `${toolName}-${runId}.pdf`

    try {
      await prisma.exportEvent.create({
        data: {
          userId: user.id,
          toolId: run.toolSlug || undefined,
          runId,
          type: 'pdf',
        },
      })
    } catch {
      // ignore logging failures
    }

    return new NextResponse(Buffer.from(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed.' }, { status: 500 })
  }
}
