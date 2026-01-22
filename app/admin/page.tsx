import Link from 'next/link'
import { Button } from '@/components/app/Button'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Admin Overview</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Quick links and ops status.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {['Platform Status', 'Queue Health', 'Payments'].map((card) => (
          <div key={card} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <p className="text-sm font-semibold">{card}</p>
            {/* TODO: replace (ui): show real system status metrics. */}
            <p className="text-xs text-[hsl(var(--muted))]">Mock status ok.</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/analytics"><Button>Analytics</Button></Link>
        <Link href="/admin/support"><Button variant="outline">Support</Button></Link>
        <Link href="/admin/billing/refunds"><Button variant="outline">Refunds</Button></Link>
        <Link href="/admin/tools"><Button variant="outline">Tool Config</Button></Link>
      </div>
    </section>
  )
}
