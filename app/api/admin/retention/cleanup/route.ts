import { NextResponse } from 'next/server'
import { requireAdmin, canSupport } from '@/lib/adminAuth'
import { prisma } from '@/lib/db'
import { logAdminAudit } from '@/src/lib/admin/audit'

export async function POST() {
  const admin = await requireAdmin()
  if (!canSupport(admin.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const retentionDays = Number(process.env.TOOL_RUN_RETENTION_DAYS || 30)
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

  const deleted = await prisma.toolRun.deleteMany({
    where: {
      createdAt: { lt: cutoff },
    },
  })

  await logAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: 'admin.retention.cleanup',
    meta: { deleted: deleted.count, cutoff: cutoff.toISOString() },
  })

  return NextResponse.json({ deleted: deleted.count, cutoff: cutoff.toISOString() })
}
