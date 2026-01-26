import Stripe from 'stripe'
import { prisma } from '@/src/lib/prisma'
import { getTokenBalance } from '@/src/lib/tokens/ledger'
import { DAILY_TOKENS } from '@/src/lib/billing/tokenEconomy'
import { getPlanTierFromPlanId } from '@/src/lib/billing/planCatalog'
import { getRolloverPolicy } from '@/src/lib/billing/tokenRollover'

export const dynamic = 'force-dynamic'

type UsageRow = {
  id: string
  email: string
  plan: string
  daily: number
  rolloverCap: number
  bonusTokens: number
  source: 'db' | 'stripe'
}

async function loadFromDb(): Promise<UsageRow[]> {
  const entitlements = await prisma.entitlement.findMany({ take: 50 })
  const userIds = entitlements.map((entry) => entry.user_id)
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u.email]))

  const rows: UsageRow[] = []
  for (const entry of entitlements) {
    const email = userMap.get(entry.user_id) || 'unknown'
    const planTier = getPlanTierFromPlanId(entry.plan)
    const daily = DAILY_TOKENS[planTier]
    const rollover = getRolloverPolicy(planTier)
    const bonusTokens = await getTokenBalance(entry.user_id)
    rows.push({
      id: entry.user_id,
      email,
      plan: entry.plan,
      daily,
      rolloverCap: rollover.cap,
      bonusTokens,
      source: 'db',
    })
  }
  return rows
}

async function loadFromStripe(): Promise<UsageRow[]> {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return []
  const stripe = new Stripe(key, { apiVersion: '2023-10-16', typescript: true })
  const customers = await stripe.customers.list({ limit: 50 })
  return customers.data.map((customer) => {
    const planId = customer.metadata?.plan || 'free'
    const planTier = getPlanTierFromPlanId(planId)
    const rollover = getRolloverPolicy(planTier)
    return {
      id: customer.id,
      email: customer.email || 'unknown',
      plan: planId,
      daily: DAILY_TOKENS[planTier],
      rolloverCap: rollover.cap,
      bonusTokens: Number(customer.metadata?.bonus_tokens || customer.metadata?.bonus_tokens_add || 0),
      source: 'stripe',
    }
  })
}

export default async function AdminUsagePage() {
  let rows: UsageRow[] = []
  let dbAvailable = true

  try {
    rows = await loadFromDb()
  } catch {
    dbAvailable = false
    rows = await loadFromStripe()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Usage</h1>
        <p className="text-sm text-[hsl(var(--muted))]">
          Plan limits + token balances. {dbAvailable ? 'DB source.' : 'Stripe fallback.'}
        </p>
      </div>

      {!dbAvailable ? (
        <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 text-xs text-[hsl(var(--muted))]">
          DB unavailable — showing Stripe metadata only.
        </div>
      ) : null}

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
        {rows.length === 0 ? (
          <p className="text-sm text-[hsl(var(--muted))]">No usage records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[hsl(var(--muted))]">
                <tr>
                  <th className="py-2">Email</th>
                  <th className="py-2">Plan</th>
                  <th className="py-2">Daily allowance</th>
                  <th className="py-2">Rollover cap</th>
                  <th className="py-2">Bonus tokens</th>
                  <th className="py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-[hsl(var(--border))]">
                    <td className="py-2">{row.email}</td>
                    <td className="py-2">{row.plan}</td>
                    <td className="py-2">{row.daily.toLocaleString()}</td>
                    <td className="py-2">{row.rolloverCap.toLocaleString()}</td>
                    <td className="py-2">{row.bonusTokens.toLocaleString()}</td>
                    <td className="py-2">{row.source}</td>
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
