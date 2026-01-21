export type AdminSession = {
  id: string
  email: string
  role: 'admin'
}

/**
 * requireAdmin()
 * - DEV: optionally allow bypass via env when DEV_AUTH_BYPASS=true
 * - PROD: must be wired to real auth + real admin role/allowlist
 *
 * Dev bypass env vars (only when DEV_AUTH_BYPASS=true):
 * - DEV_ADMIN_ID
 * - DEV_ADMIN_EMAIL
 *
 * Production recommendation:
 * - Use auth provider role/claim OR DB role field OR ADMIN_EMAILS allowlist
 */
export const requireAdmin = async (): Promise<AdminSession> => {
  const isProd = process.env.NODE_ENV === 'production'
  const devBypassEnabled = process.env.DEV_AUTH_BYPASS === 'true'

  // ✅ DEV BYPASS (explicit opt-in)
  if (!isProd && devBypassEnabled) {
    const id = process.env.DEV_ADMIN_ID || 'admin_dev_1'
    const email = process.env.DEV_ADMIN_EMAIL || 'admin@example.com'
    return { id, email, role: 'admin' }
  }

  // ❗ PRODUCTION (or dev without bypass): real admin auth required
  throw new Error(
    [
      'Forbidden: admin auth not configured.',
      '',
      'Wire requireAdmin() to your real auth provider + admin authorization.',
      'If you are developing locally and want dev-bypass, set:',
      '  DEV_AUTH_BYPASS=true',
      '  DEV_ADMIN_ID=admin_dev_1',
      '  DEV_ADMIN_EMAIL=admin@example.com',
    ].join('\n')
  )
}
