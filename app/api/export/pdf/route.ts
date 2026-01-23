import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import { jsPDF } from 'jspdf'

function addSection(doc: jsPDF, title: string, body: string, y: number) {
  doc.setFontSize(12)
  doc.setFont(undefined, 'bold')
  doc.text(title, 40, y)
  doc.setFont(undefined, 'normal')
  doc.setFontSize(10)
  const lines = doc.splitTextToSize(body, 520)
  doc.text(lines, 40, y + 16)
  return y + 16 + lines.length * 12 + 12
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
    doc.setFont(undefined, 'bold')
    doc.text(`${toolName} Report`, 40, 40)
    doc.setFontSize(10)
    doc.setFont(undefined, 'normal')
    doc.text(`Run ID: ${runId}`, 40, 58)
    doc.text(`Created: ${createdAt}`, 40, 72)

    let y = 100
    y = addSection(doc, 'Inputs', JSON.stringify(input, null, 2), y)
    y = addSection(doc, 'Outputs', JSON.stringify(output, null, 2), y)

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
