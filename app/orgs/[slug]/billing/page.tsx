import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const fetchOrg = async (slug: string) => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/orgs/${slug}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function OrgBillingPage({ params }: { params: { slug: string } }) {
  const data = await fetchOrg(params.slug)
  const org = data?.org

  if (!org) {
    return <div className="p-6">Org not found.</div>
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Org Billing</h1>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
          <p>Plan: {org.plan}</p>
          <p>Seats included: {org.seatsIncluded}</p>
          <p>Seat limit: {org.seatsMax}</p>
          <p className="text-xs text-[hsl(var(--muted))]">Invoices handled via Stripe.</p>
        </div>
      </div>
    </div>
  )
}
