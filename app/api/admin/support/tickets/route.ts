import { NextResponse } from 'next/server'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'
import { getMockTickets } from '@/src/lib/mock/data'

export const dynamic = 'force-dynamic'

export async function GET() {
  await requireAdmin()
  // TODO: replace (ui): load real support queue for admins.
  return NextResponse.json({ tickets: await getMockTickets() })
}
