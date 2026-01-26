import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { TrackEvent } from '@/src/components/analytics/TrackEvent'
import { BillingSuccessClient } from '@/src/components/billing/BillingSuccessClient'

type Props = {
  searchParams?: { session_id?: string }
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams?.session_id
  const headline = 'Confirming access…'
  const subcopy = 'This usually takes a few seconds.'
  const meta: Record<string, any> = { sessionId: sessionId || null }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">{headline}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">{subcopy}</p>
        <p className="text-xs text-[hsl(var(--muted))]">
          If anything looks off, usage updates within a few seconds.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/tools">
            <Button>Continue to tools</Button>
          </Link>
        </div>
      </div>
      <TrackEvent eventName="checkout_completed" meta={meta} />
      <BillingSuccessClient />
    </div>
  )
}
