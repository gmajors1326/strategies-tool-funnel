import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import { logAdminAudit } from '@/src/lib/admin/audit'
import { requireAdmin as requireAppAdmin } from '@/src/lib/auth/requireAdmin'

export type AdminRole = 'admin' | 'support' | 'analyst'

export type AdminSession = {
  userId: string
  email: string
  role: AdminRole
}

export type AdminAccessPolicy = 'any' | 'admin' | 'support' | 'analytics'

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

export async function getAdminSession(): Promise<AdminSession> {
  const admin = await requireAppAdmin()
  const role = resolveAdminRole({ userId: admin.id, email: admin.email }) ?? 'admin'
  return {
    userId: admin.id,
    email: admin.email,
    role,
  }
}

export async function requireAdmin(): Promise<AdminSession> {
  return getAdminSession()
}

export async function requireAdminAccess(
  request: Request,
  options: {
    action: string
    policy?: AdminAccessPolicy
    target?: string | null
    meta?: Record<string, any>
  }
): Promise<AdminSession> {
  const admin = await getAdminSession()
  const policy = options.policy ?? 'any'

  if (policy === 'admin' && admin.role !== 'admin') {
    throw forbidden('admin role required')
  }
  if (policy === 'support' && !canSupport(admin.role)) {
    throw forbidden('support role required')
  }
  if (policy === 'analytics' && !canViewAnalytics(admin.role)) {
    throw forbidden('analytics role required')
  }

  const url = new URL(request.url)
  await logAdminAudit({
    actorId: admin.userId,
    actorEmail: admin.email,
    action: options.action,
    target: options.target ?? null,
    meta: {
      role: admin.role,
      method: request.method,
      path: url.pathname,
      ...options.meta,
    },
  })

  return admin
}

export async function rateLimitAdminAction(
  admin: AdminSession,
  action: string,
  config = rateLimitConfigs.adminSensitiveAction
) {
  const identifier = `admin:${admin.userId}:${action}`
  return checkRateLimit(identifier, config)
}

export function canViewAnalytics(role: AdminRole) {
  return role === 'admin' || role === 'analyst'
}

export function canSupport(role: AdminRole) {
  return role === 'admin' || role === 'support'
}

function forbidden(reason: string) {
  const err = new Error(`Forbidden: admin access denied. Reason: ${reason}`) as any
  err.status = 403
  return err
}
