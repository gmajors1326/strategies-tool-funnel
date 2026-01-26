import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/src/generated/prisma/client'
import { requireAdminAccess } from '@/lib/adminAuth'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Number(searchParams.get('limit') || '50')
  await requireAdminAccess(request, {
    action: 'admin.stripe.events.list',
    policy: 'analytics',
    meta: { limit },
  })
  try {
    const events = await prisma.stripeEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: Math.max(1, Math.min(limit, 200)),
    })
    return NextResponse.json({ events })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      return NextResponse.json(
        {
          events: [],
          warning: 'StripeEvent table missing. Run migrations to enable event history.',
        },
        { status: 200 }
      )
    }
    throw err
  }
}
