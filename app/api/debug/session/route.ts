import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    await requireAdmin()
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 })
  }

  const all = cookies().getAll().map(c => ({
    name: c.name,
    // don't leak full value; just show length + first chars
    valuePreview: c.value ? `${c.value.slice(0, 8)}…(${c.value.length})` : '',
  }))

  return NextResponse.json({
    ok: true,
    nodeEnv: process.env.NODE_ENV,
    cookieCount: all.length,
    cookies: all,
  })
}
