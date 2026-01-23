import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { Card } from '@/src/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">Billing help</h1>
          <p className="text-sm text-[hsl(var(--muted))]">Clear answers to common billing questions.</p>
        </div>

        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Why am I locked?</h2>
            <p className="text-sm text-[hsl(var(--muted))]">
              Locks happen when you hit daily tokens, a cooldown, or a plan limit. The banner on each tool explains the
              exact reason and what to do next.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">When do tokens reset?</h2>
            <p className="text-sm text-[hsl(var(--muted))]">
              Tokens reset daily at a consistent local time. Your Usage page shows the exact reset time.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">How do token packs work?</h2>
            <p className="text-sm text-[hsl(var(--muted))]">
              Packs add tokens on top of your plan balance. They apply immediately after payment and stack with daily
              resets.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">How do I manage or cancel my plan?</h2>
            <p className="text-sm text-[hsl(var(--muted))]">
              Use the Manage plan button to open the billing portal and update or cancel anytime.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Refunds</h2>
            <p className="text-sm text-[hsl(var(--muted))]">
              If something looks off, reach out to support and we’ll review the purchase with you.
            </p>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/account/usage">
            <Button>View usage</Button>
          </Link>
          <Link href="/pricing">
            <Button variant="outline">See pricing</Button>
          </Link>
          <form action="/api/billing/portal" method="post">
            <Button variant="outline" type="submit">
              Manage plan
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
