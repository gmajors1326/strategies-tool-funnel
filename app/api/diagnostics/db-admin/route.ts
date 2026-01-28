import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAccess } from '@/lib/adminAuth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  let isAdmin = false
  try {
    await requireAdminAccess(request, {
      action: 'admin.diagnostics.db',
      policy: 'admin',
    })
    isAdmin = true
  } catch {
    isAdmin = false
  }

  const start = Date.now()

  try {
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    return NextResponse.json({ status: 'healthy', latency }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: isAdmin ? (error?.message ?? 'db_unreachable') : 'db_unreachable',
      },
      { status: 503 }
    )
  }
}
