import { NextRequest, NextResponse } from 'next/server'
import { acceptInvite } from '@/src/lib/orgs/invites'
import { logAudit } from '@/src/lib/orgs/orgs'
import { updateSubscriptionSeats } from '@/src/lib/orgs/billing'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // TODO: replace (auth): derive user ID from authenticated session.
  const userId = 'user_dev_1'
  const body = await request.json()
  const token = String(body.token || '')
  if (!token) {
    return NextResponse.json({ error: 'token required' }, { status: 400 })
  }
  const invite = await acceptInvite({ token, userId })
  if (!invite) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }
  await logAudit({ orgId: invite.orgId, userId, action: 'invite_accepted', targetId: invite.id })
  await updateSubscriptionSeats(invite.orgId)
  return NextResponse.json({ ok: true, orgId: invite.orgId })
}
