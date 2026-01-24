'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type VaultItem = {
  id: string
  title: string
  toolSlug: string | null
  createdAt: string
  tags?: string[]
}

export function VaultClient({
  items,
  canExport,
}: {
  items: VaultItem[]
  canExport: boolean
}) {
  const [busyId, setBusyId] = React.useState<string | null>(null)
  const [list, setList] = React.useState(items)

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const res = await fetch('/api/vault/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) return
      setList((prev) => prev.filter((item) => item.id !== id))
    } finally {
      setBusyId(null)
    }
  }

  if (!list.length) {
    return <div className="rounded-md border bg-muted/20 p-4 text-sm text-muted-foreground">No vault items yet.</div>
  }

  return (
    <div className="space-y-3">
      {list.map((item) => (
        <div
          key={item.id}
          className="flex flex-col gap-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <div className="text-sm font-medium">{item.title}</div>
            <div className="text-xs text-muted-foreground">
              {item.toolSlug || 'tool'} · {new Date(item.createdAt).toLocaleString()}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/vault/${item.id}`}>
              <Button variant="secondary" size="sm">
                View
              </Button>
            </Link>
            <Button
              variant="secondary"
              size="sm"
              asChild
              disabled={!canExport}
              title={canExport ? 'Export JSON' : 'Available on Pro'}
            >
              <a href={`/api/vault/export?id=${item.id}&type=json`}>Export JSON</a>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              asChild
              disabled={!canExport}
              title={canExport ? 'Export PDF' : 'Available on Pro'}
            >
              <a href={`/api/vault/export?id=${item.id}&type=pdf`}>Export PDF</a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={busyId === item.id}
              onClick={() => handleDelete(item.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}
