import { NextResponse } from 'next/server'
import { requireUser } from '@/src/lib/auth/requireUser'
import { prisma } from '@/src/lib/prisma'

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const user = await requireUser()

  const existing = await prisma.planItem.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.planItem.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
