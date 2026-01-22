import 'server-only'
import { prisma } from '@/src/lib/prisma'

// IMPORTANT: this should be your existing auth guard that throws:
// "Unauthorized: user session missing or invalid. Sign in via /verify..."
import { requireUser } from '@/src/lib/auth/requireUser'

export type AdminUser = {
  id: string
  email: string
  provider: 'app-auth' | 'dev'
  prismaUserId?: string
}

export async function requireAdmin(): Promise<AdminUser> {
  // Get the currently signed-in user from YOUR app auth (/verify OTP session)
  const sessionUser = await requireUser()
  const email = (sessionUser.email || '').toLowerCase().trim()
  if (!email) throw forbidden('missing email on session user')

  // Optional env allowlist (fast unblock / emergency)
  const allow = parseEmailAllowlist(process.env.ADMIN_EMAILS)
  if (allow.has(email)) {
    return { id: sessionUser.id, email, provider: 'app-auth' }
  }

  // Prisma authorization (source of truth)
  const u = await prisma.user.findUnique({
    where: { email },
    select: { id: true, isAdmin: true },
  })

  if (!u) throw forbidden('no prisma user for this email')
  if (!u.isAdmin) throw forbidden('user is not admin')

  return {
    id: sessionUser.id,
    email,
    provider: 'app-auth',
    prismaUserId: u.id,
  }
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
