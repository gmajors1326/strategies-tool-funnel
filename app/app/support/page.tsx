import Link from 'next/link'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default function SupportPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Support Hub</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Troubleshoot or open a ticket.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {['Reset limits', 'Billing help', 'Tool failed', 'Account issues'].map((item) => (
          <div key={item} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
            <p className="text-sm font-semibold">{item}</p>
            <p className="text-xs text-[hsl(var(--muted))]">Mock troubleshoot action.</p>
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
