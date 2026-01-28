import { cookies } from 'next/headers'
import { getSessionFromCookieValue, getSessionCookieName } from './auth'
import { getAdminSession } from '@/lib/adminAuth'

export async function getSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(getSessionCookieName())
  const session = await getSessionFromCookieValue(cookie?.value)
  if (session) return session

  try {
    const admin = await getAdminSession()
    return { userId: admin.userId, email: admin.email, plan: 'pro_monthly' }
  } catch {
    return null
  }
}
