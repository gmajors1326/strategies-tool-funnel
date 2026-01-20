import { NextResponse } from 'next/server'
import { requireAdmin, canSupport } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'

export async function GET() {
  const admin = await requireAdmin()
  if (!canSupport(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deliveries = await prisma.webhookDelivery.findMany({
    orderBy: { receivedAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ deliveries })
}
