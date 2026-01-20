import { TOKEN_PACKS } from '@/src/lib/billing/tokenPacks'
import { PLAN_PRICES } from '@/src/lib/billing/planPrices'
import { Section } from '@/src/components/pricing/Section'
import { PricingCard } from '@/src/components/pricing/PricingCard'
import { CheckoutButton } from '@/src/components/billing/CheckoutButton'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

const planCopy: Record<string, { subtitle: string; priceDisplay: string }> = {
  pro: { subtitle: 'For serious creators scaling output.', priceDisplay: '$49' },
  business: { subtitle: 'For teams that need scale.', priceDisplay: '$149' },
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-6xl space-y-10 px-6 py-10">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Pricing</h1>
          <p className="text-sm text-[hsl(var(--muted))]">
            Buy tokens or upgrade plans. Tokens are credited after payment.
          </p>
        </div>

        <Section title="Plans" description="Cancel anytime. Refunds within 14 days if not heavily used.">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <PricingCard
              sku={{
                id: 'free',
                type: 'subscription',
                title: 'Free',
                subtitle: 'Get started with core tools.',
                priceDisplay: 'Free',
              }}
              note="Cancel anytime. Refunds available within 14 days if not heavily used."
            >
              <Link href="/app">
                <Button className="w-full">Start free</Button>
              </Link>
            </PricingCard>
            {PLAN_PRICES.map((plan) => (
              <PricingCard
                key={plan.planId}
                sku={{
                  id: plan.planId,
                  type: 'subscription',
                  title: plan.displayName,
                  subtitle: planCopy[plan.planId]?.subtitle ?? '',
                  priceDisplay: planCopy[plan.planId]?.priceDisplay ?? '',
                  billingInterval: 'month',
                }}
                note="Cancel anytime. Refunds available within 14 days if not heavily used."
              >
                <CheckoutButton
                  label="Upgrade plan"
                  payload={{ type: 'plan', plan: plan.planId }}
                />
              </PricingCard>
            ))}
          </div>
        </Section>

        <Section title="Token Packs" description="Top up tokens for more runs.">
          <div className="grid gap-4 md:grid-cols-3">
            {TOKEN_PACKS.map((pack) => (
              <PricingCard
                key={pack.packId}
                sku={{
                  id: pack.packId,
                  type: 'token_pack',
                  title: pack.displayName,
                  subtitle: pack.bonusPercent ? `${pack.bonusPercent}% bonus tokens` : 'Standard pack',
                  priceDisplay: pack.bonusPercent ? 'Best value' : 'Pack',
                  tokensGranted: pack.tokensGranted,
                }}
              >
                <CheckoutButton
                  label="Buy tokens"
                  payload={{ type: 'token_pack', packId: pack.packId }}
                />
              </PricingCard>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
