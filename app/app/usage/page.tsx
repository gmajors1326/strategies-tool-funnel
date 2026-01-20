import { headers } from 'next/headers'
import { fetchUiConfig } from '@/src/lib/ui/fetchUiConfig'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

const fetchLedger = async () => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/me/ledger?limit=50`, { cache: 'no-store' })
  if (!res.ok) return { entries: [] }
  return res.json()
}

export default async function UsagePage() {
  const uiConfig = await fetchUiConfig()
  const ledger = await fetchLedger()

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Usage & Tokens</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Daily caps, ledger, and packs.</p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
        <p className="text-sm">Daily runs: {uiConfig.usage.dailyRunsUsed} / {uiConfig.usage.dailyRunCap}</p>
        <p className="text-sm">Daily tokens: {uiConfig.usage.aiTokensUsed} / {uiConfig.usage.aiTokenCap}</p>
        <p className="text-sm">Tokens remaining: {uiConfig.usage.tokensRemaining}</p>
        <p className="text-xs text-[hsl(var(--muted))]">
          Resets at {new Date(uiConfig.usage.resetsAtISO).toLocaleString()}
        </p>
        <Link href="/pricing">
          <Button>Buy tokens</Button>
        </Link>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <p className="text-sm font-semibold">Recent ledger entries</p>
        <div className="space-y-2 text-xs text-[hsl(var(--muted))]">
          {ledger.entries?.length ? (
            ledger.entries.map((entry: any) => (
              <div key={entry.id} className="flex items-center justify-between">
                <span>{entry.eventType}</span>
                <span>{entry.tokensDelta}</span>
              </div>
            ))
          ) : (
            <p>No ledger entries yet.</p>
          )}
        </div>
      </div>
    </section>
  )
}
