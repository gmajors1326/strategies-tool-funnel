import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decodeSessionToken, getSessionCookieName } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(getSessionCookieName())?.value
  const session = sessionCookie ? decodeSessionToken(sessionCookie) : null

  return NextResponse.json({
    signedIn: Boolean(session?.userId),
    email: session?.email || null,
  })
}
