'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/src/components/ui/Button'
import Link from 'next/link'

type Org = { id: string; name: string; slug: string }

export function OrgSwitcher() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/orgs')
    const data = await res.json()
    setOrgs(data.orgs || [])
  }

  useEffect(() => {
    load()
  }, [])

  const setActive = async (orgId: string) => {
    await fetch('/api/orgs/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId }),
    })
    setActiveOrgId(orgId)
  }

  if (!orgs.length) {
    return (
      <Link href="/orgs">
        <Button variant="outline">Create org</Button>
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <select
        className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
        value={activeOrgId ?? orgs[0].id}
        onChange={(e) => setActive(e.target.value)}
      >
        {orgs.map((org) => (
          <option key={org.id} value={org.id}>
            {org.name}
          </option>
        ))}
      </select>
      <Link href="/orgs">
        <Button variant="outline">Manage</Button>
      </Link>
    </div>
  )
}
