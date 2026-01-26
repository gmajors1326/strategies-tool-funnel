import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminAccess } from '@/lib/adminAuth'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  email: z.string().email(),
  isAdmin: z.boolean(),
})

export async function GET(request: NextRequest) {
  await requireAdminAccess(request, { action: 'admin.access.list', policy: 'admin' })
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ admins })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { email, isAdmin } = updateSchema.parse(body)
  const normalizedEmail = email.trim().toLowerCase()

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, email: true, isAdmin: true, name: true },
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await requireAdminAccess(request, {
    action: isAdmin ? 'admin.access.grant' : 'admin.access.revoke',
    policy: 'admin',
    target: user.id,
    meta: { email: normalizedEmail, name: user.name ?? null, isAdmin },
  })

  if (user.isAdmin === isAdmin) {
    return NextResponse.json({ ok: true, user })
  }

  const updated = await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isAdmin },
    select: { id: true, email: true, isAdmin: true, name: true },
  })

  return NextResponse.json({ ok: true, user: updated })
}
