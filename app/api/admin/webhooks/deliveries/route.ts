import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  await requireAdminAccess(request, {
    action: 'admin.webhooks.deliveries.list',
    policy: 'support',
  })

  const deliveries = await prisma.webhookDelivery.findMany({
    orderBy: { receivedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ deliveries })
}
