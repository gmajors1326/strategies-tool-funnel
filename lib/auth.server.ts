import { cookies } from 'next/headers'
import { getSessionFromCookieValue, getSessionCookieName } from './auth'

export async function getSession() {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(getSessionCookieName())
  return getSessionFromCookieValue(cookie?.value)
}
