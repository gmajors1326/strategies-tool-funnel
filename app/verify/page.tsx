import { Suspense } from 'react'
import VerifyClient from './VerifyClient'

export const dynamic = 'force-dynamic'

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="relative min-h-screen bg-[#6b8b62] text-foreground flex items-center justify-center p-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-6 text-sm text-[#5f6b52] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
            Loading verification…
          </div>
        </div>
      }
    >
      <VerifyClient />
    </Suspense>
  )
}
