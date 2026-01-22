import { prisma } from '@/src/lib/prisma'

export async function logAdminAudit(params: {
  actorId?: string | null
  actorEmail?: string | null
  action: string
  target?: string | null
  meta?: Record<string, any>
}) {
  const { actorId, actorEmail, action, target, meta } = params
  return prisma.adminAuditLog.create({
    data: {
      actorId: actorId ?? null,
      actorEmail: actorEmail ?? null,
      action,
      target: target ?? null,
      meta: meta ?? undefined,
    },
  })
}
