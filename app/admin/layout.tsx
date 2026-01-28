import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/app/AdminShell'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  // Exempt routes that must be reachable without admin
  const h = await headers()
  const path = h.get('x-pathname') || h.get('next-url') || ''
  const isNotAuthorized = path.includes('/admin/not-authorized')
  const isLogin = path.includes('/admin/login')

  if (!isNotAuthorized && !isLogin) {
    try {
      await requireAdmin()
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase()

      // Missing session -> send to login
      if (
        msg.includes('unauthorized') ||
        msg.includes('session missing') ||
        msg.includes('session invalid') ||
        msg.includes('sign in via /verify')
      ) {
        redirect('/admin/login?force=1')
      }

      // Signed in but not admin
      redirect('/admin/not-authorized')
    }
  }

  if (isLogin || isNotAuthorized) {
    return <>{children}</>
  }

  return <AdminShell>{children}</AdminShell>
}
