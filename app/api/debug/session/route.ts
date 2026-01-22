import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET() {
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
