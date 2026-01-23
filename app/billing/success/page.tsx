import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { getStripe } from '@/src/lib/billing/stripe'
import { getSku } from '@/src/lib/billing/skus'
import { TrackEvent } from '@/src/components/analytics/TrackEvent'
import { BillingSuccessClient } from '@/src/components/billing/BillingSuccessClient'

type Props = {
  searchParams?: { session_id?: string }
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams?.session_id
  let headline = 'Payment received'
  let subcopy = 'Your purchase is being applied.'
  let meta: Record<string, any> = {}
  let expectedType: 'plan' | 'tokens' | undefined
  let confirmedLabel: string | undefined

  if (sessionId) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const skuId = session.metadata?.sku
      const sku = skuId ? getSku(skuId) : null

      if (session.mode === 'subscription') {
        headline = 'You’re unlocked.'
        subcopy = 'Your plan is updating now.'
        expectedType = 'plan'
        confirmedLabel = 'Pro unlocked.'
      } else if (session.mode === 'payment' && sku && 'tokensGranted' in sku) {
        headline = 'Tokens added.'
        subcopy = 'Your balance updates within a few seconds.'
        expectedType = 'tokens'
        confirmedLabel = 'Tokens added.'
      }

      meta = { sku: skuId || null, mode: session.mode }
    } catch {
      // fallback stays generic
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <h1 className="text-2xl font-semibold">{headline}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">{subcopy}</p>
        <p className="text-xs text-[hsl(var(--muted))]">
          If anything looks off, usage updates within a few seconds.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/app">
            <Button>Back to tools</Button>
          </Link>
          <Link href="/account/usage">
            <Button variant="outline">View usage</Button>
          </Link>
        </div>
      </div>
      <TrackEvent eventName="checkout_completed" meta={meta} />
      <BillingSuccessClient expectedType={expectedType} confirmedLabel={confirmedLabel} />
    </div>
  )
}
