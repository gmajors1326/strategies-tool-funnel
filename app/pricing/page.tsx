import { Suspense } from 'react'
import { PricingClient } from './PricingClient'

export const dynamic = 'force-dynamic'

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#7d9b76] text-[hsl(var(--text))]" />}>
      <PricingClient />
    </Suspense>
  )
}
