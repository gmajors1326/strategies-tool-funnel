import Link from 'next/link'
import { fetchUiConfig } from '@/src/lib/mock/fetchUiConfig'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  // TODO: replace (ui): fetch billing data from authenticated backend endpoint.
  const uiConfig = await fetchUiConfig()
  const planLabelMap: Record<string, string> = {
    free: '7-Day Free Trial',
    pro_monthly: 'Pro',
    team: 'Elite',
    lifetime: 'Pro',
  }
  const planLabel = planLabelMap[uiConfig.user.planId] ?? uiConfig.user.planId
  const usage = uiConfig.usage
  const resetsAt = usage?.resetsAtISO ? new Date(usage.resetsAtISO).toLocaleString() : 'Daily'

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Billing</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Plan and billing settings.</p>
      </div>
      <div className="rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-4 space-y-3 text-[#2f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
        <p className="text-sm">Current Plan: {planLabel}</p>
        <p className="text-xs text-[#5f6b52]">Cancel anytime for subscriptions.</p>
        <Button variant="outline">Cancel Plan</Button>
        <a href="/refund-policy" className="text-xs text-red-300 hover:text-red-200">
          Refund policy
        </a>
      </div>

      <div className="rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-4 space-y-3 text-[#2f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
        <div>
          <h2 className="text-sm font-semibold">Token usage</h2>
          <p className="text-xs text-[#5f6b52]">Track daily usage and buy more when needed.</p>
        </div>
        <div className="grid gap-2 text-xs text-[#5f6b52]">
          <div>Balance: {usage?.purchasedTokensRemaining?.toLocaleString?.() ?? 0} tokens</div>
          <div>
            Daily usage: {usage?.aiTokensUsed?.toLocaleString?.() ?? 0} / {usage?.aiTokenCap?.toLocaleString?.() ?? 0}
          </div>
          <div>Resets: {resetsAt}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/pricing?tab=tokens">Buy more tokens</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/pricing">Compare Pro and Elite</Link>
          </Button>
        </div>
        <p className="text-xs text-[#5f6b52]">
          During your 7-day trial you can buy token packs to extend usage. Pro and Elite include higher daily tokens and
          typically cost less than buying packs week after week.
        </p>
      </div>
    </section>
  )
}
