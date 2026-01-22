import { ensureDevDbReady } from './devDbGuard'
import { requireAdmin as requireAppAdmin } from '@/src/lib/auth/requireAdmin'

export type AdminRole = 'admin' | 'support' | 'analyst'

export type AdminSession = {
  userId: string
  email: string
  role: AdminRole
}

type AdminIdentity = {
  userId: string
  email: string
}

const normalizeEmail = (value: string) => value.trim().toLowerCase()

const parseEnvList = (value?: string, normalize?: (raw: string) => string) => {
  if (!value) return new Set<string>()
  const formatter = normalize ?? ((raw) => raw.trim())
  return new Set(
    value
      .split(',')
      .map((entry) => formatter(entry))
      .filter((entry) => entry.length > 0)
  )
}

const adminEmailSet = parseEnvList(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL, normalizeEmail)
const adminUserIdSet = parseEnvList(process.env.ADMIN_USER_IDS)
const supportEmailSet = parseEnvList(process.env.ADMIN_SUPPORT_EMAILS, normalizeEmail)
const supportUserIdSet = parseEnvList(process.env.ADMIN_SUPPORT_USER_IDS)
const analystEmailSet = parseEnvList(process.env.ADMIN_ANALYST_EMAILS, normalizeEmail)
const analystUserIdSet = parseEnvList(process.env.ADMIN_ANALYST_USER_IDS)

export function resolveAdminRole(identity: AdminIdentity): AdminRole | null {
  const normalizedEmail = normalizeEmail(identity.email)
  if (adminEmailSet.has(normalizedEmail) || adminUserIdSet.has(identity.userId)) {
    return 'admin'
  }
  if (supportEmailSet.has(normalizedEmail) || supportUserIdSet.has(identity.userId)) {
    return 'support'
  }
  if (analystEmailSet.has(normalizedEmail) || analystUserIdSet.has(identity.userId)) {
    return 'analyst'
  }
  return null
}

export async function requireAdmin(): Promise<AdminSession> {
  await ensureDevDbReady()
  const admin = await requireAppAdmin()
  return {
    userId: admin.id,
    email: admin.email,
    role: 'admin',
  }
}

export function canViewAnalytics(role: AdminRole) {
  return role === 'admin' || role === 'analyst'
}

export function canSupport(role: AdminRole) {
  return role === 'admin' || role === 'support'
}
