import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'

export async function POST(request: Request) {
  const retentionDays = Number(process.env.TOOL_RUN_RETENTION_DAYS || 30)
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  await requireAdminAccess(request, {
    action: 'admin.retention.cleanup',
    policy: 'support',
    meta: { retentionDays, cutoff: cutoff.toISOString() },
  })

  const deleted = await prisma.toolRun.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  })

  return NextResponse.json({ deleted: deleted.count, cutoff: cutoff.toISOString() })
}
