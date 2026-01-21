import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { createInvite } from '@/src/lib/orgs/invites'
import { requireOrgRole, logAudit } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // TODO: replace (auth): derive user ID from authenticated session.
  const userId = 'user_dev_1'
  const body = await request.json()
  const orgId = String(body.orgId || '')
  const email = String(body.email || '').toLowerCase()
  const role = String(body.role || 'member')

  if (!orgId || !email) {
    return NextResponse.json({ error: 'orgId and email required' }, { status: 400 })
  }

  const membership = await requireOrgRole(userId, orgId, ['owner', 'admin'])
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } })
  if (org?.domain) {
    const domain = email.split('@')[1]
    if (domain !== org.domain) {
      return NextResponse.json({ error: 'Email domain not allowed' }, { status: 400 })
    }
  }

  const invite = await createInvite({ orgId, email, role })
  await logAudit({ orgId, userId, action: 'invite_created', targetId: invite.id, meta: { email, role } })
  return NextResponse.json({ invite })
}
