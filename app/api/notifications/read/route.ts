import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { markNotificationsRead } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const ids = Array.isArray(body?.ids) ? body.ids : []
  if (ids.length === 0) {
    return NextResponse.json({ error: 'Missing ids' }, { status: 400 })
  }

  await markNotificationsRead(session.userId, ids)
  return NextResponse.json({ success: true })
}
