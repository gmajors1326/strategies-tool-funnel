'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/Button'

export default function AdminTokensPage() {
  // TODO: replace (auth): prefill admin tools from authenticated admin context.
  const [userId, setUserId] = useState('user_dev_1')
  const [tokensDelta, setTokensDelta] = useState('1000')
  const [reason, setReason] = useState('adjustment')
  const [status, setStatus] = useState<string | null>(null)

  const handleAdjust = async () => {
    setStatus('working')
    const res = await fetch('/api/admin/tokens/adjust', {
      method: 'POST',
      // TODO: replace (auth): send admin identity via real auth/session.
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_dev_1' },
      body: JSON.stringify({ userId, tokensDelta: Number(tokensDelta), reason }),
    })
    const data = await res.json()
    setStatus(res.ok ? `Balance: ${data.balance}` : data.error?.message || 'error')
  }

  const handleGrantBonus = async () => {
    setStatus('granting')
    const res = await fetch('/api/admin/bonus-runs/grant', {
      method: 'POST',
      // TODO: replace (auth): send admin identity via real auth/session.
      headers: { 'Content-Type': 'application/json', 'x-admin-id': 'admin_dev_1' },
      body: JSON.stringify({ userId, runsGranted: 3, reason: 'admin grant' }),
    })
    const data = await res.json()
    setStatus(res.ok ? `Bonus grant: ${data.bonus.id}` : data.error?.message || 'error')
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin Tokens</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Adjust tokens and grant bonus runs.</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <label className="text-xs text-[hsl(var(--muted))]">User ID</label>
        <input
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <label className="text-xs text-[hsl(var(--muted))]">Tokens Delta</label>
        <input
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
          value={tokensDelta}
          onChange={(e) => setTokensDelta(e.target.value)}
        />
        <label className="text-xs text-[hsl(var(--muted))]">Reason</label>
        <input
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2">
          <Button onClick={handleAdjust}>Adjust tokens</Button>
          <Button variant="outline" onClick={handleGrantBonus}>Grant bonus runs</Button>
        </div>
        {status && <p className="text-xs text-[hsl(var(--muted))]">{status}</p>}
      </div>
    </section>
  )
}
