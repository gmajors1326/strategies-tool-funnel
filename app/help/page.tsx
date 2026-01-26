import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { Card } from '@/src/components/ui/Card'

export const dynamic = 'force-dynamic'

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#5f7f57] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        <div>
          <h1 className="text-2xl font-semibold">Help</h1>
          <p className="text-sm text-[#5f6b52]">Quick guidance for starting your trial and upgrading.</p>
        </div>

        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Start your 7-day trial</h2>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-[#5f6b52]">
              <li>Click Sign In and enter your name + email.</li>
              <li>Open the email link to finish sign-in.</li>
              <li>Run any tool and review the summary.</li>
            </ol>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Pro vs Elite</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-[#5f6b52]">
              <li>Pro: 2,000 daily tokens, reduced cooldowns, save + export JSON/CSV.</li>
              <li>Elite: 6,000 daily tokens, no cooldowns, unlimited history, all exports.</li>
            </ul>
            <p className="mt-2 text-sm text-[#5f6b52]">
              Your trial ends after 7 days. Choose Pro or Elite to keep access.
            </p>
          </div>
        </Card>

        <div>
          <h2 className="text-xl font-semibold">Billing help</h2>
          <p className="text-sm text-[#5f6b52]">Clear answers to common billing questions.</p>
        </div>

        <Card className="space-y-4">
          <div>
            <h2 className="text-sm font-semibold">Why am I locked?</h2>
            <p className="text-sm text-[#5f6b52]">
              Locks happen when you hit daily tokens, a cooldown, or a plan limit. The banner on each tool explains the
              exact reason and what to do next.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">When do tokens reset?</h2>
            <p className="text-sm text-[#5f6b52]">
              Tokens reset daily at a consistent local time. Your Usage page shows the exact reset time.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">How do token packs work?</h2>
            <p className="text-sm text-[#5f6b52]">
              Packs add tokens on top of your plan balance. They apply immediately after payment and stack with daily
              resets.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">How do I manage or cancel my plan?</h2>
            <p className="text-sm text-[#5f6b52]">
              Use the Manage plan button to open the billing portal and update or cancel anytime.
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Refunds</h2>
            <p className="text-sm text-[#5f6b52]">
              If something looks off, reach out to support and we’ll review the purchase with you.
            </p>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link href="/account/usage">
            <Button>View usage</Button>
          </Link>
          <Link href="/app/support">
            <Button variant="outline">Submit support ticket</Button>
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
