import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/app/AdminShell'
import { requireAdmin } from '@/src/lib/auth/requireAdmin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  try {
    await requireAdmin()
  } catch (e: any) {
    // If they're not allowed, don't crash the app — bounce them cleanly.
    if (e?.status === 403 || String(e?.message || '').toLowerCase().includes('forbidden')) {
      redirect('/admin/not-authorized')
    }
    throw e
  }

  return <AdminShell>{children}</AdminShell>
}
