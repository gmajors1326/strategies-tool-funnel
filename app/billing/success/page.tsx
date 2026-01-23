import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { getStripe } from '@/src/lib/billing/stripe'
import { getSku } from '@/src/lib/billing/skus'
import { TrackEvent } from '@/src/components/analytics/TrackEvent'

type Props = {
  searchParams?: { session_id?: string }
}

export default async function BillingSuccessPage({ searchParams }: Props) {
  const sessionId = searchParams?.session_id
  let headline = 'Payment received'
  let subcopy = 'Your purchase is being applied.'
  let meta: Record<string, any> = {}

  if (sessionId) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      const skuId = session.metadata?.sku
      const sku = skuId ? getSku(skuId) : null

      if (session.mode === 'subscription') {
        headline = 'You’re unlocked.'
        subcopy = 'Your plan is updating now.'
      } else if (session.mode === 'payment' && sku && 'tokensGranted' in sku) {
        headline = 'Tokens added.'
        subcopy = 'Your balance updates within a few seconds.'
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
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export default function BillingSuccessPage() {
  const [status, setStatus] = useState('Checking ledger...')
  const [tokens, setTokens] = useState<number | null>(null)

  useEffect(() => {
    let active = true
    const poll = async () => {
      const res = await fetch('/api/me/usage')
      const data = await res.json()
      if (!active) return
      setTokens(data.tokensRemaining ?? 0)
      setStatus('Tokens updated.')
    }
    const interval = setInterval(poll, 2000)
    poll()
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-3xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Payment successful</h1>
        <p className="text-sm text-[hsl(var(--muted))]">{status}</p>
        {tokens !== null && (
          <p className="text-sm">Current token balance: {tokens}</p>
        )}
        <Link href="/app">
          <Button>Go to dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
