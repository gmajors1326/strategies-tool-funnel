import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookieName } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const res = NextResponse.redirect(new URL('/', request.url))
  res.cookies.set('admin_session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  res.cookies.set(getSessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  })
  return res
}
