import Link from 'next/link'
import { fetchUiConfig } from '@/src/lib/mock/fetchUiConfig'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  // TODO: replace (ui): fetch account data from authenticated backend endpoint.
  const uiConfig = await fetchUiConfig()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Account</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Profile and plan summary.</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
        <p className="text-sm">Email: {uiConfig.user.email}</p>
        <p className="text-sm">Plan: {uiConfig.user.planId}</p>
        <div className="flex flex-wrap gap-2">
          <Button>Manage Profile</Button>
          <Button variant="outline" asChild>
            <Link href="/account/usage">Usage</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
