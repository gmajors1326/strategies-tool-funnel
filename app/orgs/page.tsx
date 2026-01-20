'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export default function OrgsPage() {
  const [orgs, setOrgs] = useState<any[]>([])
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [status, setStatus] = useState('')

  const load = async () => {
    const res = await fetch('/api/orgs')
    const data = await res.json()
    setOrgs(data.orgs || [])
  }

  useEffect(() => {
    load()
  }, [])

  const createOrg = async () => {
    const res = await fetch('/api/orgs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug }),
    })
    const data = await res.json()
    setStatus(res.ok ? 'Created' : data.error || 'Error')
    load()
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-semibold">Organizations</h1>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
          <p className="text-sm font-semibold">Create org</p>
          <input
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
            placeholder="Org name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
            placeholder="org-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
          />
          <Button onClick={createOrg}>Create</Button>
          {status && <p className="text-xs text-[hsl(var(--muted))]">{status}</p>}
        </div>
        <div className="space-y-2">
          {orgs.map((org) => (
            <div key={org.id} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">{org.name}</p>
                <p className="text-xs text-[hsl(var(--muted))]">{org.slug}</p>
              </div>
              <Link href={`/orgs/${org.slug}`}>
                <Button>Open</Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
