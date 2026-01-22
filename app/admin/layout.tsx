import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/app/AdminShell'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin()
  } catch (e: any) {
    const msg = String(e?.message || '').toLowerCase()

    // Not signed in -> go to OTP login
    if (
      msg.includes('unauthorized') ||
      msg.includes('session missing') ||
      msg.includes('session invalid') ||
      msg.includes('sign in via /verify')
    ) {
      redirect('/verify')
    }

    // Signed in but not admin -> polite bounce
    if (e?.status === 403 || msg.includes('forbidden') || msg.includes('admin')) {
      redirect('/admin/not-authorized')
    }

    // Anything else is a real bug
    throw e
  }

  return <AdminShell>{children}</AdminShell>
}
