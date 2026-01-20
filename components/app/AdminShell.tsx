import type { ReactNode } from 'react'
import { AdminNav } from '@/components/app/AdminNav'

type AdminShellProps = {
  children: ReactNode
}

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <p className="mb-4 text-xs uppercase tracking-wide text-[hsl(var(--muted))]">
              Admin Control
            </p>
            <AdminNav />
          </div>
        </aside>
        <main className="flex-1 space-y-6">{children}</main>
      </div>
    </div>
  )
}
