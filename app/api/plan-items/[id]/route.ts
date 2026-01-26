import { NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { prisma } from '@/src/lib/prisma'

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser()
  const { id } = await params

  // @ts-expect-error - planItem model not yet in schema
  const existing = await prisma.planItem.findFirst({
    where: { id, userId: user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  // @ts-expect-error - planItem model not yet in schema
  await prisma.planItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
