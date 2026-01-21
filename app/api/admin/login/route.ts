import { NextRequest, NextResponse } from 'next/server'

const ADMIN_COOKIE_NAME = 'admin_session'
// TODO: replace (auth): validate admin login against real identity provider.
const ADMIN_EMAIL = process.env.ADMIN_LOGIN_EMAIL || 'gmajors1326@gmail.com'
// TODO: replace (auth): remove hardcoded fallback password and use secure auth flow.
const ADMIN_PASSWORD = process.env.ADMIN_LOGIN_PASSWORD || '123456'

function encodeSession(payload: { userId: string; email: string; role: 'admin' }): string {
  const json = JSON.stringify(payload)
  return Buffer.from(json).toString('base64url')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    // TODO: replace (auth): use real admin user ID from auth provider.
    const session = encodeSession({
      userId: 'admin-user',
      email: ADMIN_EMAIL,
      role: 'admin',
    })

    response.cookies.set(ADMIN_COOKIE_NAME, session, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
