import { headers } from 'next/headers'

export const dynamic = 'force-dynamic'

const fetchStripeEvents = async () => {
  const headerList = headers()
  const host = headerList.get('host') ?? 'localhost:3000'
  const proto = headerList.get('x-forwarded-proto') ?? 'http'
  const res = await fetch(`${proto}://${host}/api/admin/stripe/events?limit=50`, { cache: 'no-store' })
  if (!res.ok) return { events: [] }
  return res.json()
}

export default async function AdminPaymentsPage() {
  const data = await fetchStripeEvents()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Payments</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Recent Stripe events (read-only).</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2 text-xs text-[hsl(var(--muted))]">
        {data.events?.length ? (
          data.events.map((event: any) => (
            <div key={event.id} className="flex items-center justify-between">
              <span>{event.type}</span>
              <span>{new Date(event.createdAt).toLocaleString()}</span>
            </div>
          ))
        ) : (
          <p>No events yet.</p>
        )}
      </div>
    </section>
  )
}
