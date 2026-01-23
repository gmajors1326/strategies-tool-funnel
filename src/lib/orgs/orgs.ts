import { Prisma } from '@prisma/client'
import { prisma } from '@/src/lib/prisma'

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export const getActiveOrg = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.activeOrgId) return null
    return prisma.organization.findUnique({ where: { id: user.activeOrgId } })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
      return null
    }
    throw err
  }
}

export const setActiveOrg = async (userId: string, orgId: string) => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { activeOrgId: orgId },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2022') {
      return
    }
    throw err
  }
}

export const listUserOrgs = async (userId: string) => {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: { organization: true },
  })
}

export const getMembership = async (userId: string, orgId: string) => {
  return prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId } },
  })
}

export const requireOrgRole = async (userId: string, orgId: string, roles: OrgRole[]) => {
  const membership = await getMembership(userId, orgId)
  if (!membership || membership.status !== 'active') return null
  if (!roles.includes(membership.role as OrgRole)) return null
  return membership
}

export const createOrg = async (params: { name: string; slug: string; ownerId: string; domain?: string | null }) => {
  const { name, slug, ownerId, domain } = params
  return prisma.organization.create({
    data: {
      name,
      slug,
      domain: domain || null,
      memberships: {
        create: {
          userId: ownerId,
          role: 'owner',
          status: 'active',
        },
      },
    },
  })
}

export const logAudit = async (params: {
  orgId?: string | null
  userId?: string | null
  action: string
  targetId?: string | null
  meta?: Record<string, any>
}) => {
  const { orgId, userId, action, targetId, meta } = params
  return prisma.auditLog.create({
    data: {
      orgId: orgId || null,
      userId: userId || null,
      action,
      targetId: targetId || null,
      meta: meta || undefined,
    },
  })
}

export const logToolRun = async (params: {
  orgId?: string | null
  userId: string
  toolId: string
  runId: string
  meteringMode: string
  tokensCharged: number
  status: string
  lockCode?: string | null
  durationMs?: number | null
}) => {
  try {
    return prisma.toolRunLog.create({
      data: {
        orgId: params.orgId || null,
        userId: params.userId,
        toolId: params.toolId,
        runId: params.runId,
        meteringMode: params.meteringMode,
        tokensCharged: params.tokensCharged,
        status: params.status,
        lockCode: params.lockCode || null,
        durationMs: params.durationMs || null,
      },
    })
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      return null
    }
    throw err
  }
}
