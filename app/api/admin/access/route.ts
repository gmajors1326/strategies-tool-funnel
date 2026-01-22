import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { prisma } from '@/src/lib/prisma'
import { logAdminAudit } from '@/src/lib/admin/audit'

export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  email: z.string().email(),
  isAdmin: z.boolean(),
})

export async function GET() {
  await requireAdmin()
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true, email: true, name: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ admins })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
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

  if (user.isAdmin === isAdmin) {
    return NextResponse.json({ ok: true, user })
  }

  const updated = await prisma.user.update({
    where: { email: normalizedEmail },
    data: { isAdmin },
    select: { id: true, email: true, isAdmin: true, name: true },
  })

  await logAdminAudit({
    actorId: admin.id,
    actorEmail: admin.email,
    action: isAdmin ? 'admin.access.grant' : 'admin.access.revoke',
    target: updated.id,
    meta: { email: updated.email, name: updated.name ?? null, isAdmin },
  })

  return NextResponse.json({ ok: true, user: updated })
}
