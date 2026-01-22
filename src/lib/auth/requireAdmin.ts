import 'server-only'
import { prisma } from '@/src/lib/prisma'

// IMPORTANT: this must exist in your codebase already.
// It's the function currently throwing:
// "Unauthorized: user session missing or invalid. Sign in via /verify..."
import { requireUser } from '@/src/lib/auth/requireUser'

export type AdminUser = {
  id: string
  email: string
  provider: 'app-auth' | 'dev'
  prismaUserId?: string
}

export async function requireAdmin(): Promise<AdminUser> {
  // Dev bypass (local only)
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    return {
      id: process.env.DEV_ADMIN_ID || 'admin_dev_1',
      email: process.env.DEV_ADMIN_EMAIL || 'admin@example.com',
      provider: 'dev',
    }
  }

  // 1) Ensure user session exists (OTP /verify auth)
  const u = await requireUser()
  const email = (u.email || '').toLowerCase().trim()
  if (!email) throw forbidden('missing email on session user')

  // 2) Quick env allowlist (fast unblock / emergency)
  const allow = parseEmailAllowlist(process.env.ADMIN_EMAILS)
  if (allow.has(email)) {
    return { id: u.id, email, provider: 'app-auth' }
  }

  // 3) DB-backed admin flag (real source of truth)
  const db = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isAdmin: true },
  })

  if (!db) throw forbidden('no prisma user for this email')
  if (!db.isAdmin) throw forbidden('user is not admin')

  return { id: u.id, email, provider: 'app-auth', prismaUserId: db.id }
}

function parseEmailAllowlist(raw?: string) {
  const set = new Set<string>()
  if (!raw) return set
  raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .forEach((e) => set.add(e))
  return set
}

function forbidden(reason: string) {
  const err = new Error(`Forbidden: admin access denied. Reason: ${reason}`) as any
  err.status = 403
  return err
}
