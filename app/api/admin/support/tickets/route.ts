import { NextResponse } from 'next/server'
import { requireAdminAccess } from '@/lib/adminAuth'
import { listTicketsForAdmin } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    await requireAdminAccess(request, {
      action: 'admin.support.tickets.list',
      policy: 'support',
    })
  } catch (err: any) {
    const status = err?.status || 403
    return NextResponse.json({ error: 'Unauthorized', tickets: [] }, { status })
  }

  try {
    const tickets = await listTicketsForAdmin()
    return NextResponse.json({ tickets })
  } catch (err: any) {
    return NextResponse.json({ tickets: [], error: err?.message ?? 'Support queue unavailable.' })
  }
}
