import { NextRequest, NextResponse } from 'next/server'
import { getMembership, setActiveOrg, logAudit } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // TODO: replace (auth): derive user ID from authenticated session.
  const userId = 'user_dev_1'
  const body = await request.json()
  const orgId = String(body.orgId || '')
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 })
  }
  const membership = await getMembership(userId, orgId)
  if (!membership || membership.status !== 'active') {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }
  await setActiveOrg(userId, orgId)
  await logAudit({ orgId, userId, action: 'active_org_changed', targetId: orgId })
  return NextResponse.json({ ok: true })
}
