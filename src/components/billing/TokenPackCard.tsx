import type { ReactNode } from 'react'
import { Card } from '@/src/components/ui/Card'

type TokenPackCardProps = {
  title: string
  price?: string
  tokens: number
  runsEstimate: string
  bestFor: string
  children?: ReactNode
}

export function TokenPackCard({ title, price, tokens, runsEstimate, bestFor, children }: TokenPackCardProps) {
  return (
    <Card className="space-y-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-[hsl(var(--muted))]">{bestFor}</p>
      </div>
      {price ? <div className="text-xl font-semibold">{price}</div> : null}
      <div className="text-2xl font-semibold">{tokens.toLocaleString()} tokens</div>
      <p className="text-xs text-[hsl(var(--muted))]">{runsEstimate}</p>
      {children}
    </Card>
  )
}
