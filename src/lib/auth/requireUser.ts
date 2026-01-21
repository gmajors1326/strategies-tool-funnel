export type UserSession = {
  id: string
  email: string
  planId: 'free' | 'pro_monthly' | 'lifetime' | 'team'
  role?: 'user' | 'admin'
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

  // ✅ DEV BYPASS (explicit opt-in)
  // NOTE: This is intentionally not "automatic" in dev.
  if (!isProd && devBypassEnabled) {
    // Next.js Request headers are not available here unless you pass them in.
    // So we read from process env as fallback AND support header injection by API routes.
    // API routes should prefer the header path (see note below).
    const id = process.env.DEV_USER_ID || 'user_dev_1'
    const email = process.env.DEV_USER_EMAIL || 'dev@example.com'
    const planId = (process.env.DEV_USER_PLAN as UserSession['planId']) || 'pro_monthly'
    const role = (process.env.DEV_USER_ROLE as UserSession['role']) || 'user'

    return { id, email, planId, role }
  }

  // ❗ PRODUCTION (or dev without bypass): real auth required
  // We do NOT return a fake user session here.
  throw new Error(
    [
      'Unauthorized: auth not configured.',
      '',
      'Wire requireUser() to your real auth provider (Clerk/NextAuth/Supabase/etc.).',
      'If you are developing locally and want dev-bypass, set:',
      '  DEV_AUTH_BYPASS=true',
      '  DEV_USER_ID=user_dev_1',
      '  DEV_USER_EMAIL=dev@example.com',
      '  DEV_USER_PLAN=pro_monthly',
      '  DEV_USER_ROLE=user',
    ].join('\n')
  )
}
