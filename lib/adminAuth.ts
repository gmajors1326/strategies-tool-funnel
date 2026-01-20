export type AdminRole = 'admin' | 'support' | 'analyst'

export type AdminSession = {
  userId: string
  email: string
  role: AdminRole
}

import { cookies } from 'next/headers'

const ADMIN_COOKIE_NAME = 'admin_session'

function decodeSessionCookie(value: string): AdminSession | null {
  try {
    const json = Buffer.from(value, 'base64url').toString('utf-8')
    const parsed = JSON.parse(json) as AdminSession
    if (!parsed?.userId || !parsed?.email || !parsed?.role) return null
    return parsed
  } catch {
    return null
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME)
  if (!sessionCookie?.value) {
    throw new Error('Unauthorized')
  }

  const session = decodeSessionCookie(sessionCookie.value)
  if (!session) {
    throw new Error('Unauthorized')
  }

  return session
}

export function canViewAnalytics(role: AdminRole) {
  return role === 'admin' || role === 'analyst'
}

export function canSupport(role: AdminRole) {
  return role === 'admin' || role === 'support'
}
