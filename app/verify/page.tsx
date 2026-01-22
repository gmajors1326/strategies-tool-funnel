import { Suspense } from 'react'
import VerifyClient from './VerifyClient'

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-hero-cactus text-foreground flex items-center justify-center p-4">
          <div className="pointer-events-none absolute inset-0 bg-cactus-glow" />
          <div className="relative w-full max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6 text-sm text-[hsl(var(--muted))]">
            Loading verification…
          </div>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  )
}
