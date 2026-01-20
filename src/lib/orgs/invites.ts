import { prisma } from '@/src/lib/prisma'

export const createInvite = async (params: {
  orgId: string
  email: string
  role: string
}) => {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  return prisma.organizationInvite.create({
    data: {
      orgId: params.orgId,
      email: params.email,
      role: params.role,
      token,
      expiresAt,
    },
  })
}

export const getInviteByToken = async (token: string) => {
  return prisma.organizationInvite.findUnique({ where: { token } })
}

export const acceptInvite = async (params: { token: string; userId: string }) => {
  const invite = await prisma.organizationInvite.findUnique({ where: { token: params.token } })
  if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) return null

  await prisma.organizationMember.upsert({
    where: { orgId_userId: { orgId: invite.orgId, userId: params.userId } },
    update: { status: 'active', role: invite.role },
    create: {
      orgId: invite.orgId,
      userId: params.userId,
      role: invite.role,
      status: 'active',
      invitedEmail: invite.email,
      invitedBy: null,
    },
  })

  return prisma.organizationInvite.update({
    where: { token: params.token },
    data: { acceptedAt: new Date() },
  })
}
