import type { ReactNode } from 'react'
import { AppShell } from '@/src/components/app/AppShell'
import { fetchUiConfig } from '@/src/lib/ui/fetchUiConfig'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: ReactNode }) {
  const uiConfig = await fetchUiConfig()
  return <AppShell uiConfig={uiConfig}>{children}</AppShell>
}
