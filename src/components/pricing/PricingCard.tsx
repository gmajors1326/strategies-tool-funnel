import type { ReactNode } from 'react'
import type { Sku } from '@/src/lib/billing/skuRegistry'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'

type PricingCardProps = {
  sku: Sku
  children?: ReactNode
  note?: string
}

export function PricingCard({ sku, children, note }: PricingCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{sku.title}</p>
          {sku.subtitle && (
            <p className="text-xs text-[hsl(var(--muted))]">{sku.subtitle}</p>
          )}
        </div>
        {sku.featured && <Badge label="Best value" variant="featured" />}
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-semibold">{sku.priceDisplay}</p>
        {sku.billingInterval && (
          <p className="text-xs text-[hsl(var(--muted))]">/{sku.billingInterval}</p>
        )}
      </div>
      {sku.tokensGranted && (
        <p className="text-xs text-[hsl(var(--muted))]">{sku.tokensGranted} tokens</p>
      )}
      {note && <p className="text-xs text-[hsl(var(--muted))]">{note}</p>}
      {children}
    </Card>
  )
}
