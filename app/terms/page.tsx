export const dynamic = 'force-dynamic'

export default function TermsPage() {
  return (
    <div className="bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold">Terms of Service</h1>
          <p className="text-sm text-[hsl(var(--muted))]">Last updated: January 25, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-[hsl(var(--muted))]">
          <p>
            By using Strategy Tools, you agree to these terms. Use the service responsibly, and do not attempt to
            reverse-engineer, resell, or abuse the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Billing</h2>
          <p className="text-sm text-[hsl(var(--muted))]">
            Subscriptions and token packs are billed through our payment provider. Charges are recurring for
            subscriptions unless canceled.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Refund policy</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[hsl(var(--muted))]">
            <li>Refunds are reviewed case by case for duplicate charges or billing errors.</li>
            <li>We do not guarantee refunds for consumed tokens or fully used subscription periods.</li>
            <li>To request a refund, contact support within 7 days of the charge with your account email.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Cancellation</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[hsl(var(--muted))]">
            <li>Go to Account → Billing → Manage plan to open the billing portal.</li>
            <li>Canceling stops future renewals; access continues until the end of the current billing period.</li>
            <li>If you have issues canceling, contact support and we will assist.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Account responsibility</h2>
          <p className="text-sm text-[hsl(var(--muted))]">
            You are responsible for maintaining the security of your account and any content you submit.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Contact</h2>
          <p className="text-sm text-[hsl(var(--muted))]">
            Questions about billing or terms can be sent to support via the Help page.
          </p>
        </section>
      </div>
    </div>
  )
}
