'use client'

import { useEffect, useState } from 'react'

type AdminInfo = {
  id: string
  email: string
  role: string
}

type AdminBadgeState =
  | { status: 'loading' }
  | { status: 'ready'; admin: AdminInfo }
  | { status: 'error'; message: string }

export function AdminSessionBadge() {
  const [state, setState] = useState<AdminBadgeState>({ status: 'loading' })

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const res = await fetch('/api/admin/whoami', { cache: 'no-store', credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (!active) return
        if (!res.ok) {
          setState({ status: 'error', message: data?.error || 'Session unavailable' })
          return
        }
        setState({ status: 'ready', admin: data.admin })
      } catch (err: any) {
        if (!active) return
        setState({ status: 'error', message: err?.message || 'Session unavailable' })
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  if (state.status === 'loading') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-1 text-xs text-[hsl(var(--muted))]">
        Admin session...
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-950/30 px-3 py-1 text-xs text-red-200">
        {state.message}
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-1 text-xs text-[hsl(var(--text))]">
      <span className="font-semibold">{state.admin.email}</span>
      <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-[hsl(var(--muted))]">
        {state.admin.role}
      </span>
    </div>
  )
}
