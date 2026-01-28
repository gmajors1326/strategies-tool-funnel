import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    return NextResponse.json({ status: 'healthy', latency }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error?.message ?? 'db_unreachable',
      },
      { status: 503 }
    )
  }
}
