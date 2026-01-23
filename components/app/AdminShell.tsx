import type { ReactNode } from 'react'
import { AdminNav } from '@/components/app/AdminNav'

type AdminShellProps = {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="admin-theme min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-5 shadow-[0_24px_40px_rgba(0,0,0,0.35)]">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted))]">
              Admin Console
            </p>
            <AdminNav />
          </div>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  )
}
