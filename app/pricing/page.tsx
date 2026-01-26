import { Suspense } from 'react'
import { PricingClient } from './PricingClient'

export const dynamic = 'force-dynamic'

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#6b8b62] text-[hsl(var(--text))]" />}>
      <PricingClient />
    </Suspense>
  )
}
