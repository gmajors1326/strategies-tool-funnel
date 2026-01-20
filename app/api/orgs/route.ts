import { NextRequest, NextResponse } from 'next/server'
import { createOrg, listUserOrgs, logAudit } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const userId = 'user_dev_1'
  const memberships = await listUserOrgs(userId)
  return NextResponse.json({ orgs: memberships.map((m) => m.organization) })
}

export async function POST(request: NextRequest) {
  const userId = 'user_dev_1'
  const body = await request.json()
  const name = String(body.name || '').trim()
  const slug = String(body.slug || '').trim()
  const domain = body.domain ? String(body.domain).trim() : null
  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug required' }, { status: 400 })
  }
  const org = await createOrg({ name, slug, ownerId: userId, domain })
  await logAudit({ orgId: org.id, userId, action: 'org_created', targetId: org.id })
  return NextResponse.json({ org })
}
