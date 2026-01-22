import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, canSupport } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'
import { logAdminAudit } from '@/src/lib/admin/audit'

function maskSecret(secret: string) {
  if (secret.length <= 6) return '***'
  return `${secret.slice(0, 3)}***${secret.slice(-3)}`
}

export async function GET() {
  const admin = await requireAdmin()
  if (!canSupport(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const secrets = await prisma.webhookSecret.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      customerId: true,
      secret: true,
      active: true,
      createdAt: true,
      rotatedAt: true,
      lastUsedAt: true,
    },
  })

  return NextResponse.json({
    secrets: secrets.map((secret) => ({
      ...secret,
      secret: maskSecret(secret.secret),
    })),
  })
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!canSupport(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const customerId = String(body?.customerId || '').trim()
  const secret = String(body?.secret || '').trim()

  if (!customerId || !secret) {
    return NextResponse.json({ error: 'Missing customerId or secret' }, { status: 400 })
  }

  await prisma.webhookSecret.updateMany({
    where: { customerId, active: true },
    data: { active: false, rotatedAt: new Date() },
  })

  const created = await prisma.webhookSecret.create({
    data: {
      customerId,
      secret,
      active: true,
    },
  })

  await logAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: 'admin.webhooks.secret_rotate',
    target: created.id,
    meta: { customerId },
  })

  return NextResponse.json({
    secret: {
      ...created,
      secret: maskSecret(created.secret),
    },
  })
}
