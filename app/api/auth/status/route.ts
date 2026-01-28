import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { decodeSessionToken, getSessionCookieName } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(getSessionCookieName())?.value
  const session = sessionCookie ? decodeSessionToken(sessionCookie) : null
  const adminSession = cookieStore.get('admin_session')?.value
  let adminSignedIn = false

  if (adminSession) {
    try {
      const json = Buffer.from(adminSession, 'base64url').toString('utf8')
      const parsed = JSON.parse(json) as { userId?: string; email?: string; role?: string }
      adminSignedIn = Boolean(parsed?.email && parsed?.role)
    } catch {
      adminSignedIn = false
    }
  }

  return NextResponse.json({
    signedIn: Boolean(session?.userId) || adminSignedIn,
    email: session?.email || (adminSignedIn ? 'admin' : null),
  })
}
