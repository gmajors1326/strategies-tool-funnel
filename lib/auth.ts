import { cookies } from 'next/headers'
import { prisma } from './db'
import { hash, compare } from 'bcryptjs'

const SESSION_COOKIE_NAME = 'strategy-tools-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

export interface Session {
  userId: string
  email: string
  plan: string
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  
  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value) as Session
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, email: true, plan: true },
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      email: user.email,
      plan: user.plan,
    }
  } catch {
    return null
  }
}

export async function createSession(userId: string, email: string, plan: string): Promise<void> {
  const cookieStore = await cookies()
  const session: Session = { userId, email, plan }
  
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  })
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function hashOtp(code: string): Promise<string> {
  return hash(code, 10)
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return compare(code, hash)
}
