import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  await requireAdmin()
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || '50')
  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 200)),
  })
  return NextResponse.json({ orgs })
}
