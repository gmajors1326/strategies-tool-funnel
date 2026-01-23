import type { ReactNode } from 'react'
import { Card } from '@/src/components/ui/Card'
import { Badge } from '@/src/components/ui/Badge'

type PricingCardProps = {
  title: string
  subtitle: string
  price: string
  interval?: string
  featured?: boolean
  children?: ReactNode
}

export function PricingCard({ title, subtitle, price, interval, featured, children }: PricingCardProps) {
  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-[hsl(var(--muted))]">{subtitle}</p>
        </div>
        {featured ? <Badge label="Most popular" variant="featured" /> : null}
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-semibold">{price}</p>
        {interval ? <p className="text-xs text-[hsl(var(--muted))]">/{interval}</p> : null}
      </div>
      {children}
    </Card>
  )
}
