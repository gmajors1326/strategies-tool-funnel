import 'server-only'
import { createServerSupabaseClient } from '@/src/lib/supabase/server'
import { prisma } from '@/src/lib/prisma'

export type AdminUser = {
  id: string
  email: string
  provider: 'supabase' | 'dev'
}

export async function requireAdmin(): Promise<AdminUser> {
  // DEV bypass (local only)
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    return {
      id: process.env.DEV_ADMIN_ID || 'admin_dev_1',
      email: process.env.DEV_ADMIN_EMAIL || 'admin@example.com',
      provider: 'dev',
    }
  }

  // 1) Identify user from Supabase (server-side)
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    throw forbidden('not signed in')
  }

  const user = data.user
  const email = (user.email || '').toLowerCase().trim()
  if (!email) throw forbidden('missing email on auth user')

  // 2) Authorize admin (Prisma allowlist OR env allowlist)
  const envAllow = parseEmailAllowlist(process.env.ADMIN_EMAILS)
  if (envAllow.has(email)) {
    return { id: user.id, email, provider: 'supabase' }
  }

  // Prisma allowlist (recommended)
  // This expects a Prisma model named AdminAccess (see Step 4 optional)
  const dbAdmin = await prisma.adminAccess.findUnique({
    where: { email },
    select: { email: true },
  })

  if (!dbAdmin) throw forbidden('user is not admin')

  return { id: user.id, email, provider: 'supabase' }
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
  const err = new Error(
    `Forbidden: admin auth not configured.\n\n` +
      `Wire requireAdmin() to your real auth provider + admin authorization.\n` +
      `Reason: ${reason}\n\n` +
      `If developing locally and want dev-bypass, set:\n` +
      `  DEV_AUTH_BYPASS=true\n  DEV_ADMIN_ID=admin_dev_1\n  DEV_ADMIN_EMAIL=gmajors1326@gmail.com\n`
  ) as any
  err.status = 403
  return err
}
