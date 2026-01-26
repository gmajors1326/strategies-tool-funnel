import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'

function maskSecret(secret: string) {
  if (secret.length <= 6) return '***'
  return `${secret.slice(0, 3)}***${secret.slice(-3)}`
}

export async function GET(request: Request) {
  await requireAdminAccess(request, {
    action: 'admin.webhooks.secrets.list',
    policy: 'support',
  })

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
  const body = await request.json()
  const customerId = String(body?.customerId || '').trim()
  const secret = String(body?.secret || '').trim()

  if (!customerId || !secret) {
    return NextResponse.json({ error: 'Missing customerId or secret' }, { status: 400 })
  }

  await requireAdminAccess(request, {
    action: 'admin.webhooks.secret_rotate',
    policy: 'support',
    meta: { customerId },
  })

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

  return NextResponse.json({
    secret: {
      ...created,
      secret: maskSecret(created.secret),
    },
  })
}
