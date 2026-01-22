import Link from 'next/link'
import { listTools } from '@/src/lib/tools/registry'
import { Table } from '@/components/app/Table'

export const dynamic = 'force-dynamic'

export default async function AdminToolsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Tool Config</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Manage tool settings.</p>
      </div>
      <Table
        headers={['Tool', 'AI Level', 'Tokens/Run', 'Runs/Day (Free)']}
        rows={listTools({ includeHidden: true }).map((tool) => [
          <Link key={tool.id} href={`/admin/tools/${tool.id}`} className="text-red-300 hover:text-red-200">
            {tool.name}
          </Link>,
          tool.aiLevel,
          tool.tokensPerRun,
          tool.dailyRunsByPlan.free,
        ])}
      />
    </section>
  )
}
