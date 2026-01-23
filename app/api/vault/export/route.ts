import { NextResponse } from 'next/server'
import { prisma } from '@/src/lib/db/prisma'
import { getUserOrThrow } from '@/src/lib/auth/getUser'
import { getEntitlements } from '@/src/lib/entitlements/getEntitlements'
import { jsPDF } from 'jspdf'

export async function GET(req: Request) {
  try {
    const user = await getUserOrThrow()
    const ent = getEntitlements(user)

    if (!ent.canExport) {
      return NextResponse.json({ error: 'Export is a paid feature.', errorCode: 'PLAN_REQUIRED' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')
    if (!id || !type) {
      return NextResponse.json({ error: 'Missing id or type.' }, { status: 400 })
    }

    const item = await prisma.vaultItem.findFirst({
      where: { id, userId: user.id },
      select: { title: true, toolSlug: true, body: true, createdAt: true },
    })
    if (!item) {
      return NextResponse.json({ error: 'Vault item not found.' }, { status: 404 })
    }

    const body = (item.body as any) || {}
    const input = body.input ?? {}
    const output = body.output ?? {}

    if (type === 'json') {
      const filename = `${item.toolSlug || 'tool'}-${id}.json`
      return new NextResponse(JSON.stringify({ input, output }, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    if (type === 'pdf') {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' })
      doc.setFontSize(16)
      doc.text(item.title, 40, 40)
      doc.setFontSize(10)
      doc.text(`Created: ${item.createdAt.toISOString()}`, 40, 58)
      doc.setFontSize(12)
      doc.text('Inputs', 40, 90)
      doc.setFontSize(10)
      doc.text(doc.splitTextToSize(JSON.stringify(input, null, 2), 520), 40, 106)
      doc.setFontSize(12)
      doc.text('Outputs', 40, 300)
      doc.setFontSize(10)
      doc.text(doc.splitTextToSize(JSON.stringify(output, null, 2), 520), 40, 316)

      const pdfBuffer = doc.output('arraybuffer')
      const filename = `${item.toolSlug || 'tool'}-${id}.pdf`
      return new NextResponse(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    return NextResponse.json({ error: 'Unsupported export type.' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Export failed.' }, { status: 500 })
  }
}
