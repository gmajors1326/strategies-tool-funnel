'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

type Status = 'checking' | 'confirmed' | 'timeout'

type UsageSnapshot = {
  planId: string
  tokensRemaining: number
}

const POLL_INTERVAL_MS = 2500
const POLL_MAX_MS = 25000

type Props = {
  expectedType?: 'plan' | 'tokens'
  confirmedLabel?: string
}

export function BillingSuccessClient({ expectedType, confirmedLabel }: Props) {
  const [status, setStatus] = useState<Status>('checking')
  const [attempts, setAttempts] = useState(0)
  const baselineRef = useRef<UsageSnapshot | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startRef = useRef<number | null>(null)
  const activeRef = useRef(true)

  useEffect(() => {
    activeRef.current = true
    startRef.current = Date.now()

    async function pollOnce() {
      if (!activeRef.current) return

      setAttempts((prev) => prev + 1)

      try {
        const res = await fetch('/api/me/usage', { cache: 'no-store' })
        if (!res.ok) {
          scheduleNext()
          return
        }

        const data = await res.json()
        const planId = data?.user?.planId ?? 'free'
        const tokensRemaining = data?.tokens?.balance ?? 0

        if (!baselineRef.current) {
          baselineRef.current = { planId, tokensRemaining }
        }

        const baseline = baselineRef.current
        const planUpgraded = planId !== 'free'
        const tokensIncreased = tokensRemaining > baseline.tokensRemaining

        const confirmed =
          expectedType === 'plan'
            ? planUpgraded
            : expectedType === 'tokens'
              ? tokensIncreased
              : planUpgraded || tokensIncreased

        if (confirmed) {
          setStatus('confirmed')
          return
        }
      } catch {
        // keep polling
      }

      scheduleNext()
    }

    function scheduleNext() {
      if (!activeRef.current) return
      const startedAt = startRef.current ?? Date.now()
      if (Date.now() - startedAt >= POLL_MAX_MS) {
        setStatus('timeout')
        return
      }
      timeoutRef.current = setTimeout(pollOnce, POLL_INTERVAL_MS)
    }

    void pollOnce()

    return () => {
      activeRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [expectedType])

  if (status === 'confirmed') {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-6 pb-12">
        <p className="text-sm text-[hsl(var(--muted))]">{confirmedLabel ?? 'You’re unlocked.'}</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/app">
            <Button>Back to tools</Button>
          </Link>
          <Link href="/account/usage">
            <Button variant="outline">View usage</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'timeout') {
    return (
      <div className="mx-auto max-w-2xl space-y-3 px-6 pb-12">
        <p className="text-sm text-[hsl(var(--muted))]">Your access may take a moment to appear.</p>
        <div className="flex flex-wrap gap-2">
          <Link href="/account/usage">
            <Button variant="outline">Refresh usage</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-2 px-6 pb-12">
      <p className="text-sm text-[hsl(var(--muted))]">Confirming your access…</p>
      <p className="text-xs text-[hsl(var(--muted))]">Attempt {attempts + 1}</p>
    </div>
  )
}
