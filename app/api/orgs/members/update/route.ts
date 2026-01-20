import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { requireOrgRole, logAudit } from '@/src/lib/orgs/orgs'
import { updateSubscriptionSeats } from '@/src/lib/orgs/billing'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const userId = 'user_dev_1'
  const body = await request.json()
  const orgId = String(body.orgId || '')
  const memberId = String(body.memberId || '')
  const role = String(body.role || '')

  if (!orgId || !memberId || !role) {
    return NextResponse.json({ error: 'orgId, memberId, role required' }, { status: 400 })
  }

  const membership = await requireOrgRole(userId, orgId, ['owner', 'admin'])
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const updated = await prisma.organizationMember.update({
    where: { id: memberId },
    data: { role },
  })
  await logAudit({ orgId, userId, action: 'member_role_changed', targetId: memberId, meta: { role } })
  await updateSubscriptionSeats(orgId)
  return NextResponse.json({ member: updated })
}
