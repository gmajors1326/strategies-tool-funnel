import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/src/lib/prisma'
import { requireUser } from '@/src/lib/auth/requireUser'

export const dynamic = 'force-dynamic'

const ALLOWED_EVENTS = new Set([
  'pricing_viewed',
  'checkout_started',
  'checkout_completed',
  'lock_banner_shown',
  'lock_cta_clicked',
  'usage_viewed',
  'tool_run_locked',
  'token_low_banner_shown',
  'export_started',
  'export_completed',
  'print_opened',
  'vault_exported',
])

async function getUserIdOptional() {
  try {
    const session = await requireUser()
    return session.id
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const eventName = String(body?.eventName || '')
  const meta = body?.meta ?? null

  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ error: 'Event not allowed' }, { status: 400 })
  }

  const userId = await getUserIdOptional()

  await prisma.productEvent.create({
    data: {
      userId: userId || undefined,
      eventName,
      metaJson: meta,
    },
  })

  return NextResponse.json({ ok: true })
}
