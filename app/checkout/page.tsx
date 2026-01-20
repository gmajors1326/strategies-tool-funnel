import Link from 'next/link'
import { findSkuById } from '@/src/lib/billing/skuRegistry'
import { Card } from '@/src/components/ui/Card'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

type CheckoutPageProps = {
  searchParams?: { sku?: string }
}

export default function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const sku = findSkuById(searchParams?.sku)

  if (!sku) {
    return (
      <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
        <div className="mx-auto max-w-3xl px-6 py-10">
          <Card className="space-y-4">
            <h1 className="text-lg font-semibold">Checkout unavailable</h1>
            <p className="text-sm text-[hsl(var(--muted))]">
              We couldn&apos;t find that SKU. Head back to pricing to choose a plan.
            </p>
            <Link href="/pricing">
              <Button>Back to pricing</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <Card className="space-y-4">
          <div>
            <p className="text-sm text-[hsl(var(--muted))]">{sku.title}</p>
            <p className="text-2xl font-semibold">{sku.priceDisplay}</p>
            {sku.billingInterval && (
              <p className="text-xs text-[hsl(var(--muted))]">/{sku.billingInterval}</p>
            )}
          </div>
          <div className="space-y-1 text-xs text-[hsl(var(--muted))]">
            {sku.tokensGranted && <p>{sku.tokensGranted} tokens included</p>}
            {sku.entitlements?.tools && <p>Tools: {sku.entitlements.tools.join(', ')}</p>}
            {sku.entitlements?.seats && <p>Seats: {sku.entitlements.seats}</p>}
          </div>
          {sku.type === 'subscription' && (
            <p className="text-xs text-[hsl(var(--muted))]">Cancel anytime.</p>
          )}
          <p className="text-xs text-[hsl(var(--muted))]">
            Refunds available within 14 days if not heavily used.
          </p>
          <Button disabled className="w-full">
            Continue to payment
          </Button>
          <p className="text-xs text-[hsl(var(--muted))]">
            Payments not wired yet (Stripe coming next).
          </p>
        </Card>
        <Link href="/pricing">
          <Button variant="outline">Back to pricing</Button>
        </Link>
      </div>
    </div>
  )
}
