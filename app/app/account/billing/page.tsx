import { fetchUiConfig } from '@/src/lib/mock/fetchUiConfig'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const uiConfig = await fetchUiConfig()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Billing</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Plan and billing settings.</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <p className="text-sm">Current Plan: {uiConfig.user.planId}</p>
        <p className="text-xs text-[hsl(var(--muted))]">Cancel anytime for subscriptions.</p>
        <Button variant="outline">Cancel Plan</Button>
        <a href="/refund-policy" className="text-xs text-red-300 hover:text-red-200">
          Refund policy
        </a>
      </div>
    </section>
  )
}
