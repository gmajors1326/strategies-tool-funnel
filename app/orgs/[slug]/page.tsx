import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

const fetchOrg = async (slug: string) => {
  const headerList = await headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/orgs/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

const fetchAudit = async (slug: string) => {
  const headerList = await headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/orgs/${slug}/audit`, { cache: 'no-store' })
  if (res.status === 403) return { logs: [], allowed: false }
  if (!res.ok) return { logs: [], allowed: false }
  const data = await res.json()
  return { logs: data.logs || [], allowed: true }
}

export default async function OrgPage({ params }: { params: { slug: string } }) {
  const data = await fetchOrg(params.slug)
  const org = data?.org
  const audit = await fetchAudit(params.slug)

  if (!org) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))] p-6">Org not found.</div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{org.name}</h1>
            <p className="text-sm text-[hsl(var(--muted))]">{org.slug}</p>
          </div>
          <Link href="/orgs">
            <Button variant="outline">Back</Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <Link href={`/orgs/${org.slug}/members`}><Button>Members</Button></Link>
          <Link href={`/orgs/${org.slug}/usage`}><Button variant="outline">Usage</Button></Link>
          <Link href={`/orgs/${org.slug}/billing`}><Button variant="outline">Billing</Button></Link>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2 text-xs text-[hsl(var(--muted))]">
          {org.memberships?.map((m: any) => (
            <div key={m.id} className="flex justify-between">
              <span>{m.userId}</span>
              <span>{m.role}</span>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
          <p className="text-xs uppercase text-[hsl(var(--muted))]">Audit log</p>
          {!audit.allowed && (
            <p className="text-xs text-[hsl(var(--muted))]">Audit logs available to owners and admins.</p>
          )}
          {audit.allowed && audit.logs.length === 0 && (
            <p className="text-xs text-[hsl(var(--muted))]">No activity yet.</p>
          )}
          {audit.allowed &&
            audit.logs.map((log: any) => (
              <div key={log.id} className="flex justify-between text-xs text-[hsl(var(--muted))]">
                <span>{log.action}</span>
                <span>{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
