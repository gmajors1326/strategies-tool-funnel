import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import { listTicketsForAdmin } from '@/src/lib/support/tickets'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
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
