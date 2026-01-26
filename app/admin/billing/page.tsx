import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

type BillingRow = {
  id: string
  email: string | null
  amount: string
  mode: string
  status: string
  createdAt: string
  customerId: string | null
}

export default async function AdminBillingPage() {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return <div className="text-sm text-[hsl(var(--muted))]">Stripe is not configured.</div>
  }

  const stripe = new Stripe(key, { apiVersion: '2023-10-16', typescript: true })
  const sessions = await stripe.checkout.sessions.list({ limit: 25 })

  const rows: BillingRow[] = sessions.data.map((session) => ({
    id: session.id,
    email: session.customer_details?.email || session.customer_email || null,
    amount: session.amount_total ? `$${(session.amount_total / 100).toFixed(2)}` : '—',
    mode: session.mode,
    status: session.payment_status || session.status || 'unknown',
    createdAt: new Date(session.created * 1000).toISOString(),
    customerId: typeof session.customer === 'string' ? session.customer : session.customer?.id || null,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Billing</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Recent Stripe purchases (subscriptions + token packs).</p>
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted))]">No recent purchases.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[hsl(var(--muted))]">
                <tr>
                  <th className="py-2">Email</th>
                  <th className="py-2">Amount</th>
                  <th className="py-2">Mode</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Stripe</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[hsl(var(--border))]">
                    <td className="py-2">{row.email || '—'}</td>
                    <td className="py-2">{row.amount}</td>
                    <td className="py-2">{row.mode}</td>
                    <td className="py-2">{row.status}</td>
                    <td className="py-2">{row.createdAt}</td>
                    <td className="py-2">
                      <a
                        href={`https://dashboard.stripe.com/checkout/sessions/${row.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
