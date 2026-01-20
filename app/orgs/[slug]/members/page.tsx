'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/src/components/ui/Button'

export default function OrgMembersPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [org, setOrg] = useState<any>(null)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('member')
  const [status, setStatus] = useState('')

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/orgs/${slug}`)
      const data = await res.json()
      setOrg(data.org)
    }
    load()
  }, [slug])

  const invite = async () => {
    const res = await fetch('/api/orgs/invites/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: org.id, email, role }),
    })
    const data = await res.json()
    setStatus(res.ok ? 'Invite created' : data.error || 'Error')
  }

  const updateRole = async (memberId: string, newRole: string) => {
    const res = await fetch('/api/orgs/members/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orgId: org.id, memberId, role: newRole }),
    })
    const data = await res.json()
    setStatus(res.ok ? 'Role updated' : data.error || 'Error')
    const reloadRes = await fetch(`/api/orgs/${slug}`)
    const reloadData = await reloadRes.json()
    setOrg(reloadData.org)
  }

  if (!org) return <div className="p-6">Loading...</div>

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <h1 className="text-2xl font-semibold">Members · {org.name}</h1>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
          <p className="text-sm font-semibold">Invite member</p>
          <input
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
            placeholder="email@domain.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <Button onClick={invite}>Send invite</Button>
          {status && <p className="text-xs text-[hsl(var(--muted))]">{status}</p>}
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2 text-xs text-[hsl(var(--muted))]">
          {org.memberships?.map((m: any) => (
            <div key={m.id} className="flex items-center justify-between">
              <span>{m.userId}</span>
              <div className="flex gap-2">
                <span>{m.role}</span>
                <Button variant="outline" onClick={() => updateRole(m.id, 'viewer')}>Viewer</Button>
                <Button variant="outline" onClick={() => updateRole(m.id, 'member')}>Member</Button>
                <Button variant="outline" onClick={() => updateRole(m.id, 'admin')}>Admin</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
