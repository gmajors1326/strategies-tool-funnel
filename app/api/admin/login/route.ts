import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createSessionCookie } from '@/lib/auth'

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
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const email = String(body?.email || '').trim().toLowerCase()
    const password = String(body?.password || '')

    if (email !== ADMIN_EMAIL.toLowerCase() || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const response = NextResponse.json({ success: true })
    let userId = 'admin-user'
    try {
      const user = await prisma.user.upsert({
        where: { email: ADMIN_EMAIL },
        create: {
          email: ADMIN_EMAIL,
          plan: 'FREE',
        },
        update: {},
      })
      userId = user.id
    } catch (err) {
      console.error('[admin-login] prisma upsert failed', (err as any)?.message || err)
    }

    const sessionCookie = await createSessionCookie(userId, ADMIN_EMAIL, 'pro_monthly')
    response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options)

    const session = encodeSession({
      userId,
      email: ADMIN_EMAIL,
      role: 'admin',
    })

    response.cookies.set(ADMIN_COOKIE_NAME, session, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV !== 'development',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Invalid request' }, { status: 400 })
  }
}
