import { TOKEN_PACKS } from '@/src/lib/billing/tokenPacks'
import { Section } from '@/src/components/pricing/Section'
import { PricingCard } from '@/src/components/pricing/PricingCard'
import { CheckoutButton } from '@/src/components/billing/CheckoutButton'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { PLAN_CONFIG, type PlanKey } from '@/src/lib/billing/planConfig'

export const dynamic = 'force-dynamic'

const planOrder: PlanKey[] = ['free', 'pro', 'business']
const formatPrice = (price: number) => (price === 0 ? 'Free' : `$${price}`)

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
            {planOrder.map((planKey) => {
              const plan = PLAN_CONFIG[planKey]
              return (
                <PricingCard
                  key={planKey}
                  sku={{
                    id: planKey,
                    type: 'subscription',
                    title: plan.title,
                    subtitle: plan.subtitle,
                    priceDisplay: formatPrice(plan.price),
                    billingInterval: planKey === 'free' ? undefined : 'month',
                  }}
                  note="Cancel anytime. Refunds available within 14 days if not heavily used."
                >
                  <div className="space-y-1 text-xs text-[hsl(var(--muted))]">
                    {plan.highlights.map((item) => (
                      <p key={item}>• {item}</p>
                    ))}
                  </div>
                  {planKey === 'free' ? (
                    <Link href="/app">
                      <Button className="w-full">Start free</Button>
                    </Link>
                  ) : (
                    <CheckoutButton
                      label="Upgrade plan"
                      payload={{ type: 'plan', plan: planKey }}
                    />
                  )}
                </PricingCard>
              )
            })}
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
