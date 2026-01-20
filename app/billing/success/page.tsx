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
