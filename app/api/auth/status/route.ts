import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decodeSessionToken, getGuestCookieName, getSessionCookieName, verifyGuestToken } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get(getSessionCookieName())?.value
  const guestCookie = cookieStore.get(getGuestCookieName())?.value

  const session = sessionCookie ? decodeSessionToken(sessionCookie) : null
  const guest = guestCookie ? verifyGuestToken(guestCookie) : null

  return NextResponse.json({
    signedIn: Boolean(session?.userId),
    guest: Boolean(guest?.email),
    email: session?.email || guest?.email || null,
  })
}
