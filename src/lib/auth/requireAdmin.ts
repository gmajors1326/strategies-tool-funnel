import { requireAdmin as requireAdminCookie, type AdminRole } from '@/lib/adminAuth'
import { redirect } from 'next/navigation'

export type AdminSession = {
  id: string
  email: string
  role: AdminRole
}

/**
 * requireAdmin()
 * - DEV: optionally allow bypass via env when DEV_AUTH_BYPASS=true
 * - PROD: uses admin session cookie set by /api/admin/login
 */
export const requireAdmin = async (): Promise<AdminSession> => {
  const isProd = process.env.NODE_ENV === 'production'
  const devBypassEnabled = process.env.DEV_AUTH_BYPASS === 'true'

  if (!isProd && devBypassEnabled) {
    const id = process.env.DEV_ADMIN_ID || 'admin_dev_1'
    const email = process.env.DEV_ADMIN_EMAIL || 'admin@example.com'
    return { id, email, role: 'admin' }
  }

  try {
    const session = await requireAdminCookie()
    return { id: session.userId, email: session.email, role: session.role }
  } catch (err) {
    const reason = err instanceof Error ? err.message : ''
    const allowlistMessage = [
      'Allowlist an admin account:',
      '  ADMIN_EMAILS=admin@example.com',
      '  ADMIN_EMAIL=admin@example.com (single admin fallback)',
      '  ADMIN_USER_IDS=user_123 (optional)',
    ]
    const devBypassMessage = [
      'Dev bypass (local only):',
      '  DEV_AUTH_BYPASS=true',
      '  DEV_ADMIN_ID=admin_dev_1',
      '  DEV_ADMIN_EMAIL=admin@example.com',
    ]

    if (reason === 'Forbidden') {
      throw new Error(
        [
          'Forbidden: account is not authorized for admin access.',
          '',
          ...allowlistMessage,
          '',
          ...devBypassMessage,
        ].join('\n')
      )
    }

    throw new Error(
      [
        'Unauthorized: admin session missing or invalid.',
        '',
        'Log in via /verify (or /admin/login) and ensure your account is allowlisted.',
        '',
        ...allowlistMessage,
        '',
        ...devBypassMessage,
      ].join('\n')
    )
  }
}

export const requireAdminPage = async (): Promise<AdminSession> => {
  try {
    return await requireAdmin()
  } catch {
    redirect('/admin/login')
  }
}
