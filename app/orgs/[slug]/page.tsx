import { headers } from 'next/headers'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

const fetchOrg = async (slug: string) => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/orgs/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function OrgPage({ params }: { params: { slug: string } }) {
  const data = await fetchOrg(params.slug)
  const org = data?.org

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
      </div>
    </div>
  )
}
