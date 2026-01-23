import type { ReactNode } from 'react'
import Link from 'next/link'
import type { UiConfig } from '@/src/lib/ui/types'
import { TopUsageBar } from '@/src/components/app/TopUsageBar'
import { OrgSwitcher } from '@/src/components/orgs/OrgSwitcher'

type AppShellProps = {
  uiConfig: UiConfig
  children: ReactNode
}

const NAV_ITEMS = [
  { label: 'My Tools', href: '/app' },
  { label: 'Explore', href: '/app/explore' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Usage', href: '/app/usage' },
  { label: 'History', href: '/app/history' },
  { label: 'Support', href: '/app/support' },
  { label: 'Account', href: '/app/account' },
]

export function AppShell({ uiConfig, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto flex max-w-6xl gap-6 px-6 py-6">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <p className="mb-4 text-xs uppercase tracking-wide text-[hsl(var(--muted))]">Workspace</p>
            <nav className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-md px-3 py-2 text-sm text-[hsl(var(--muted))] hover:text-[hsl(var(--text))] hover:bg-[hsl(var(--surface-3))]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex-1 space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-[hsl(var(--muted))]">Active Org</p>
              <p className="text-sm">{uiConfig.user.planId}</p>
            </div>
            <OrgSwitcher />
          </div>
          <TopUsageBar usage={uiConfig.usage} />
          <div>{children}</div>
        </main>
      </div>
    </div>
  )
}
