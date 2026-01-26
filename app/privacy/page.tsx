export const dynamic = 'force-dynamic'

export default function PrivacyPage() {
  return (
    <div className="bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-3xl space-y-6 px-6 py-12">
        <div>
          <h1 className="text-2xl font-semibold">Privacy Policy</h1>
          <p className="text-sm text-[hsl(var(--muted))]">Last updated: January 25, 2026</p>
        </div>

        <section className="space-y-3 text-sm text-[hsl(var(--muted))]">
          <p>
            We collect only the data needed to provide the Strategy Tools, maintain security, and improve performance.
            This includes account details, usage events, and content you submit to generate outputs.
          </p>
          <p>
            We do not sell personal information. We may share data with trusted service providers (billing, analytics,
            and infrastructure) strictly to operate the service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">What we collect</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[hsl(var(--muted))]">
            <li>Account data (email, login metadata, plan status).</li>
            <li>Tool usage and product events (runs, tokens, and feature usage).</li>
            <li>Inputs and outputs you provide or generate with tools.</li>
            <li>Payment data handled by our billing provider (we do not store full card details).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">How we use data</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[hsl(var(--muted))]">
            <li>Provide and personalize tool results.</li>
            <li>Protect against abuse, fraud, and account compromise.</li>
            <li>Measure performance and improve the product experience.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Your choices</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm text-[hsl(var(--muted))]">
            <li>Request account deletion or export of your data.</li>
            <li>Update your email and billing preferences in your account.</li>
            <li>Contact support with privacy requests or questions.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Contact</h2>
          <p className="text-sm text-[hsl(var(--muted))]">
            For privacy questions, reach out to support through the Help page.
          </p>
        </section>
      </div>
    </div>
  )
}
