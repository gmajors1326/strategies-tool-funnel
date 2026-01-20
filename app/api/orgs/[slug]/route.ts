import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(_request: NextRequest, { params }: { params: { slug: string } }) {
  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: { memberships: true },
  })
  if (!org) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  return NextResponse.json({ org })
}
