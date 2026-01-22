import { headers } from 'next/headers'
import { getSession } from '@/lib/auth'
import { resolveAdminRole } from '@/lib/adminAuth'
import { ensureDevDbReady } from '@/lib/devDbGuard'
import { getOrCreateEntitlement } from '@/src/lib/usage/entitlements'

export type UserSession = {
  id: string
  email: string
  planId: 'free' | 'pro_monthly' | 'lifetime' | 'team'
  role?: 'user' | 'admin'
}

const parsePlanId = (value?: string | null): UserSession['planId'] | undefined => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'free') return 'free'
  if (normalized === 'pro_monthly') return 'pro_monthly'
  if (normalized === 'lifetime') return 'lifetime'
  if (normalized === 'team') return 'team'
  return undefined
}

const parseRole = (value?: string | null): UserSession['role'] | undefined => {
  if (!value) return undefined
  const normalized = value.trim().toLowerCase()
  if (normalized === 'admin') return 'admin'
  if (normalized === 'user') return 'user'
  return undefined
}

/**
 * requireUser()
 * - DEV: optionally allow bypass via headers when DEV_AUTH_BYPASS=true
 * - PROD: must be wired to a real auth provider (Clerk/NextAuth/Supabase/etc.)
 *
 * Dev bypass headers (only when DEV_AUTH_BYPASS=true):
 * - x-user-id: string
 * - x-user-email: string
 * - x-user-plan: free|pro_monthly|lifetime|team
 * - x-user-role: user|admin
 */
export const requireUser = async (): Promise<UserSession> => {
  const isProd = process.env.NODE_ENV === 'production'
  const devBypassEnabled = process.env.DEV_AUTH_BYPASS === 'true'

  await ensureDevDbReady()

  // ✅ DEV BYPASS (explicit opt-in)
  // NOTE: This is intentionally not "automatic" in dev.
  if (!isProd && devBypassEnabled) {
    const requestHeaders = headers()
    const headerId = requestHeaders.get('x-user-id')
    const headerEmail = requestHeaders.get('x-user-email')
    const headerPlan = requestHeaders.get('x-user-plan')
    const headerRole = requestHeaders.get('x-user-role')

    const id = headerId?.trim() || process.env.DEV_USER_ID || 'user_dev_1'
    const email = headerEmail?.trim() || process.env.DEV_USER_EMAIL || 'dev@example.com'
    const planId = parsePlanId(headerPlan) || parsePlanId(process.env.DEV_USER_PLAN) || 'pro_monthly'
    const role = parseRole(headerRole) || parseRole(process.env.DEV_USER_ROLE) || 'user'

    return { id, email, planId, role }
  }

  const session = await getSession()
  if (!session) {
    throw new Error(
      [
        'Unauthorized: user session missing or invalid.',
        '',
        'Sign in via /verify (email OTP) or enable dev bypass:',
        '  DEV_AUTH_BYPASS=true',
        '  DEV_USER_ID=user_dev_1',
        '  DEV_USER_EMAIL=dev@example.com',
        '  DEV_USER_PLAN=pro_monthly',
        '  DEV_USER_ROLE=user',
      ].join('\n')
    )
  }

  const entitlement = await getOrCreateEntitlement(session.userId)
  const planId = parsePlanId(entitlement.plan) || 'free'
  const adminRole = resolveAdminRole({ userId: session.userId, email: session.email })

  return {
    id: session.userId,
    email: session.email,
    planId,
    role: adminRole ? 'admin' : undefined,
  }
}
