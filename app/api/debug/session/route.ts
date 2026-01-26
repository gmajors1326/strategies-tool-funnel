import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  // Hard off in prod unless explicitly enabled
  const enabled = process.env.DEBUG_SESSION_ENABLED === 'true'
  if (process.env.NODE_ENV === 'production' && !enabled) {
    return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 })
  }

  // Secret header gate (works everywhere)
  const secret = process.env.DEBUG_SESSION_SECRET
  const provided = req.headers.get('x-debug-secret')
  if (!secret || provided !== secret) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const cookieStore = await cookies()
  const all = cookieStore
    .getAll()
    .map((c) => ({
      name: c.name,
      valuePreview: c.value ? `${c.value.slice(0, 8)}…(${c.value.length})` : '',
    }))

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    cookieCount: all.length,
    cookies: all,
  })
}
