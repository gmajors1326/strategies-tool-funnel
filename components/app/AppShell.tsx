import type { ReactNode } from 'react'
import type { UiConfig } from '@/src/lib/mock/data'
import { TopUsageBar } from '@/components/app/TopUsageBar'
import { SidebarNav } from '@/components/app/SidebarNav'

type AppShellProps = {
  uiConfig: UiConfig
  children: ReactNode
}

export function AppShell({ uiConfig, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-48 flex-shrink-0 lg:block">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <p className="mb-4 text-xs uppercase tracking-wide text-[hsl(var(--muted))]">
              Control Panel
            </p>
            <SidebarNav />
          </div>
        </aside>
        <main className="flex-1 space-y-6">
          <TopUsageBar usage={uiConfig.usage} />
          <div>{children}</div>
        </main>
      </div>
    </div>
  )
}
