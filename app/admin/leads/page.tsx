import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

type LeadRow = {
  id: string
  email: string | null
  type: string
  source: string
  capturedAt: string | null
  verified: string
}

async function fetchLeads(type: 'guest' | 'signup') {
  if (!process.env.STRIPE_SECRET_KEY) return []
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16',
    typescript: true,
  })

  try {
    const result = await stripe.customers.search({
      query: `metadata['lead_type']:'${type}'`,
      limit: 50,
    })
    return result.data.map((customer) => ({
      id: customer.id,
      email: customer.email,
      type: customer.metadata?.lead_type || type,
      source: customer.metadata?.lead_source || '',
      capturedAt: customer.metadata?.captured_at || null,
      verified: customer.metadata?.verified || 'false',
    }))
  } catch {
    const list = await stripe.customers.list({ limit: 50 })
    return list.data
      .filter((customer) => customer.metadata?.lead_type === type)
      .map((customer) => ({
        id: customer.id,
        email: customer.email,
        type: customer.metadata?.lead_type || type,
        source: customer.metadata?.lead_source || '',
        capturedAt: customer.metadata?.captured_at || null,
        verified: customer.metadata?.verified || 'false',
      }))
  }
}

export default async function AdminLeadsPage() {
  const [guests, signups] = await Promise.all([fetchLeads('guest'), fetchLeads('signup')])
  const rows: Array<{ title: string; data: LeadRow[] }> = [
    { title: 'Guests', data: guests },
    { title: 'Signups', data: signups },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Leads</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Guest and signup emails captured from tool gates.</p>
      </div>

      {rows.map((section) => (
        <div key={section.title} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
          <div className="mb-3 text-sm font-semibold">{section.title}</div>
          {section.data.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted))]">No leads yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-[hsl(var(--muted))]">
                  <tr>
                    <th className="py-2">Email</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Source</th>
                    <th className="py-2">Captured</th>
                    <th className="py-2">Verified</th>
                    <th className="py-2">Stripe</th>
                  </tr>
                </thead>
                <tbody>
                  {section.data.map((lead) => (
                    <tr key={lead.id} className="border-t border-[hsl(var(--border))]">
                      <td className="py-2">{lead.email || '—'}</td>
                      <td className="py-2">{lead.type}</td>
                      <td className="py-2">{lead.source || '—'}</td>
                      <td className="py-2">{lead.capturedAt || '—'}</td>
                      <td className="py-2">{lead.verified}</td>
                      <td className="py-2">
                        <a
                          href={`https://dashboard.stripe.com/customers/${lead.id}`}
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
      ))}
    </div>
  )
}
