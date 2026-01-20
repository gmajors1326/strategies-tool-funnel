'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

export default function OrgUsagePage({ params }: { params: { slug: string } }) {
  const defaultMonth = useMemo(() => new Date().toISOString().slice(0, 7), [])
  const [month, setMonth] = useState(defaultMonth)
  const [status, setStatus] = useState('')

  const handleExport = () => {
    setStatus('Export started. Check your downloads.')
    window.location.href = `/api/orgs/usage/export?month=${month}`
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Org Usage</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Download monthly usage exports.</p>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
          />
          <Button onClick={handleExport}>Download CSV</Button>
          <Link href={`/orgs/${params.slug}/billing/statement?month=${month}`}>
            <Button variant="outline">View statement</Button>
          </Link>
        </div>
        {status && <p className="text-xs text-[hsl(var(--muted))]">{status}</p>}
      </div>
    </div>
  )
}
