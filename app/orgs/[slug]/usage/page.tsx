import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

export default function OrgUsagePage({ params }: { params: { slug: string } }) {
  const month = new Date().toISOString().slice(0, 7)
  return (
    <div className="min-h-screen bg-[hsl(var(--bg))] text-[hsl(var(--text))]">
      <div className="mx-auto max-w-4xl px-6 py-10 space-y-4">
        <h1 className="text-2xl font-semibold">Org Usage</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Download monthly usage exports.</p>
        <Link href={`/api/orgs/usage/export?month=${month}`}>
          <Button>Download CSV</Button>
        </Link>
        <Link href={`/orgs/${params.slug}/billing/statement?month=${month}`}>
          <Button variant="outline">View statement</Button>
        </Link>
      </div>
    </div>
  )
}
