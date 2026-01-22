import crypto from 'crypto'
import { prisma } from './db'
import { hash, compare } from 'bcryptjs'

const SESSION_COOKIE_NAME = 'strategy-tools-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days
const IS_PRODUCTION =
  process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production'

export interface Session {
  userId: string
  email: string
  plan: string
}

export type SessionCookie = {
  name: string
  value: string
  options: {
    httpOnly: boolean
    secure: boolean
    sameSite: 'lax' | 'strict' | 'none'
    maxAge: number
    path: string
  }
}

function getSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET
  if (!secret) throw new Error('Missing AUTH_SESSION_SECRET env var')
  return secret
}

/**
 * Token format:
 * base64url(payloadJSON).base64url(hmacSHA256(payloadB64, secret))
 */
function signSessionPayload(payload: Session): string {
  const payloadJson = JSON.stringify(payload)
  const payloadB64 = Buffer.from(payloadJson).toString('base64url')
  const sig = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url')
  return `${payloadB64}.${sig}`
}

function verifySessionToken(token: string): Session | null {
  const [payloadB64, sig] = token.split('.')
  if (!payloadB64 || !sig) return null

  const expected = crypto.createHmac('sha256', getSecret()).update(payloadB64).digest('base64url')

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return null
  if (!crypto.timingSafeEqual(a, b)) return null

  try {
    const json = Buffer.from(payloadB64, 'base64url').toString('utf8')
    return JSON.parse(json) as Session
  } catch {
    return null
  }
}

export async function getSessionFromCookieValue(cookieValue?: string | null): Promise<Session | null> {
  if (!cookieValue) return null
  const parsed = verifySessionToken(cookieValue)
  if (!parsed?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, email: true, plan: true },
  })
  if (!user) return null

  return { userId: user.id, email: user.email, plan: user.plan }
}

/**
 * IMPORTANT: In Route Handlers, don't try to mutate cookies() directly.
 * Return a cookie descriptor and set it on the NextResponse.
 */
export async function createSessionCookie(userId: string, email: string, plan: string): Promise<SessionCookie> {
  const session: Session = { userId, email, plan }
  const token = signSessionPayload(session)

  return {
    name: SESSION_COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: IS_PRODUCTION,
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    },
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME
}

export async function hashOtp(code: string): Promise<string> {
  return hash(code, 10)
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return compare(code, hash)
}
