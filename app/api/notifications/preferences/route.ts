import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth.server'
import { getNotificationPreference, upsertNotificationPreference } from '@/lib/notifications'

const allowedFrequencies = new Set(['none', 'daily', 'weekly'])

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const preference = await getNotificationPreference(session.userId)
  return NextResponse.json({
    preference: preference?.digestFrequency ?? 'weekly',
  })
}

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const frequency = String(body?.digestFrequency || '').toLowerCase()
  if (!allowedFrequencies.has(frequency)) {
    return NextResponse.json({ error: 'Invalid digest frequency' }, { status: 400 })
  }

  await upsertNotificationPreference(session.userId, frequency)
  return NextResponse.json({ success: true })
}
