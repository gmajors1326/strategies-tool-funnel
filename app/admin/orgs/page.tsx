import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const fetchOrgs = async () => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/admin/orgs?limit=50`, { cache: 'no-store' })
  if (!res.ok) return { orgs: [] }
  return res.json()
}

export default async function AdminOrgsPage() {
  const data = await fetchOrgs()
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Organizations</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Support view of orgs.</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2 text-xs text-[hsl(var(--muted))]">
        {data.orgs?.length ? (
          data.orgs.map((org: any) => (
            <div key={org.id} className="flex justify-between">
              <span>{org.name}</span>
              <span>{org.plan}</span>
            </div>
          ))
        ) : (
          <p>No orgs yet.</p>
        )}
      </div>
    </section>
  )
}
