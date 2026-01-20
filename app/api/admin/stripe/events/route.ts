import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || '50')
  const events = await prisma.stripeEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: Math.max(1, Math.min(limit, 200)),
  })
  return NextResponse.json({ events })
}
