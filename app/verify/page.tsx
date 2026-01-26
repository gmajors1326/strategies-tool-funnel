import { Suspense } from 'react'
import VerifyClient from './VerifyClient'

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-[#7d9b76] text-foreground flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#3a3a3a] p-6 text-sm text-[hsl(var(--muted))] shadow-[0_24px_40px_rgba(0,0,0,0.35)]">
            Loading verification…
          </div>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  )
}
