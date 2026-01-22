'use client'

import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'

type AdminUser = {
  id: string
  email: string
  name?: string | null
  createdAt?: string
}

type AdminAccessManagerProps = {
  initialAdmins: AdminUser[]
}

export default function AdminAccessManager({ initialAdmins }: AdminAccessManagerProps) {
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshAdmins = useCallback(async () => {
    const res = await fetch('/api/admin/access', { cache: 'no-store' })
    if (!res.ok) throw new Error('Failed to load admin list')
    const data = await res.json()
    setAdmins(data.admins ?? [])
  }, [])

  const updateAdmin = useCallback(async (targetEmail: string, isAdmin: boolean) => {
    setBusy(true)
    setStatus(null)
    try {
      const res = await fetch('/api/admin/access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, isAdmin }),
      })
      const data = await res.json()
      if (!res.ok) {
        setStatus(data?.error || 'Update failed')
        return
      }
      await refreshAdmins()
      setStatus(isAdmin ? 'Admin access granted.' : 'Admin access revoked.')
    } catch (err) {
      setStatus('Update failed')
    } finally {
      setBusy(false)
    }
  }, [refreshAdmins])

  const handleGrant = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) {
      setStatus('Enter an email to grant access.')
      return
    }
    await updateAdmin(trimmed, true)
    setEmail('')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <label className="text-xs text-[hsl(var(--muted))]">Grant admin access by email</label>
        <div className="flex flex-wrap gap-2">
          <input
            className="min-w-[220px] flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
          />
          <Button onClick={handleGrant} disabled={busy}>
            {busy ? 'Saving...' : 'Grant access'}
          </Button>
        </div>
        {status && <p className="text-xs text-[hsl(var(--muted))]">{status}</p>}
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
        <div className="text-sm font-semibold">Current admins</div>
        {admins.length ? (
          admins.map((admin) => (
            <div key={admin.id} className="flex flex-wrap items-center justify-between gap-2 text-xs text-[hsl(var(--muted))]">
              <div>
                <span className="font-semibold text-[hsl(var(--text))]">{admin.email}</span>
                {admin.name ? <span className="ml-2">{admin.name}</span> : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateAdmin(admin.email, false)}
                disabled={busy}
              >
                Revoke
              </Button>
            </div>
          ))
        ) : (
          <p className="text-xs text-[hsl(var(--muted))]">No admins yet.</p>
        )}
      </div>
    </div>
  )
}
