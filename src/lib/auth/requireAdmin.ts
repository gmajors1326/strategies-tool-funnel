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
    throw new Error(
      [
        'Unauthorized: admin session missing or invalid.',
        '',
        'Log in via /admin/login or enable dev bypass:',
        '  DEV_AUTH_BYPASS=true',
        '  DEV_ADMIN_ID=admin_dev_1',
        '  DEV_ADMIN_EMAIL=admin@example.com',
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
