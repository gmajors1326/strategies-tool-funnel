'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export default function InviteAcceptPage() {
  const params = useParams()
  const token = params?.token as string
  const [status, setStatus] = useState('Accepting invite...')

  useEffect(() => {
    const accept = async () => {
      const res = await fetch('/api/orgs/invites/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()
      setStatus(res.ok ? 'Invite accepted.' : data.error || 'Invite failed.')
    }
    if (token) accept()
  }, [token])

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-2xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Organization Invite</h1>
        <p className="text-sm text-[hsl(var(--muted))]">{status}</p>
        <Link href="/orgs">
          <Button>Go to orgs</Button>
        </Link>
      </div>
    </div>
  )
}
