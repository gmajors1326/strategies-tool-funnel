import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { AppShell } from '@/src/components/app/AppShell'
import { fetchUiConfig } from '@/src/lib/ui/fetchUiConfig'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: ReactNode }) {
  let uiConfig
  try {
    uiConfig = await fetchUiConfig()
  } catch (error) {
    const message = String((error as Error)?.message || '').toLowerCase()
    if (
      message.includes('unauthorized') ||
      message.includes('session missing') ||
      message.includes('session invalid') ||
      message.includes('sign in via /verify')
    ) {
      redirect('/verify')
    }
    throw error
  }
  return <AppShell uiConfig={uiConfig}>{children}</AppShell>
}
