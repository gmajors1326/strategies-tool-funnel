import Link from 'next/link'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default function SupportPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-[#1f3b2b]">Support Hub</h1>
        <p className="text-sm text-[#1f3b2b]">Troubleshoot or open a ticket.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {['Reset limits', 'Billing help', 'Tool failed', 'Account issues'].map((item) => (
          <div key={item} className="rounded-xl border border-[#d2c1a8] bg-[#eadcc7] p-4 space-y-2 text-[#1f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
            <p className="text-sm font-semibold">{item}</p>
            {/* TODO: replace (ui): wire troubleshoot actions to support flows. */}
            <p className="text-xs text-[#1f3b2b]">Mock troubleshoot action.</p>
            <Button variant="outline">Start</Button>
          </div>
        ))}
      </div>
      <Link href="/app/support/tickets">
        <Button>View Tickets</Button>
      </Link>
    </section>
  )
}
