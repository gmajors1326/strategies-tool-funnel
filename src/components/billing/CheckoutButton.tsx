'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/Button'

type CheckoutButtonProps = {
  label: string
  payload: Record<string, any>
}

export function CheckoutButton({ label, payload }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    const res = await fetch('/api/billing/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    setLoading(false)
    if (data.url) {
      window.location.href = data.url
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Redirecting...' : label}
    </Button>
  )
}
