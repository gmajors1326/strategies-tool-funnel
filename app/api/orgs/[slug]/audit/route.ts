import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { requireOrgRole } from '@/src/lib/orgs/orgs'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  // TODO: replace (auth): derive user ID from authenticated session.
  const userId = 'user_dev_1'
  const { slug } = await params
  const org = await prisma.organization.findUnique({ where: { slug } })
  if (!org) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const membership = await requireOrgRole(userId, org.id, ['owner', 'admin'])
  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const logs = await prisma.auditLog.findMany({
    where: { orgId: org.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json({ logs })
}
