export type AdminRole = 'admin' | 'support' | 'analyst'

export type AdminSession = {
  userId: string
  email: string
  role: AdminRole
}

export async function requireAdmin(): Promise<AdminSession> {
  // TODO: Replace with your real auth/session lookup.
  // Example expectations:
  // - Validate cookie/session
  // - Ensure role is one of admin/support/analyst
  // - Throw if not authorized

  const devAllow = process.env.NODE_ENV !== 'production'
  if (devAllow) {
    return { userId: 'dev-admin', email: 'dev@local', role: 'admin' }
  }

  throw new Error('Unauthorized')
}

export function canViewAnalytics(role: AdminRole) {
  return role === 'admin' || role === 'analyst'
}

export function canSupport(role: AdminRole) {
  return role === 'admin' || role === 'support'
}
