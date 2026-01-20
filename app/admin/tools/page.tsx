import Link from 'next/link'
import { TOOL_REGISTRY } from '@/src/lib/tools/registry'
import { Table } from '@/components/app/Table'

export const dynamic = 'force-dynamic'

export default function AdminToolsPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Tool Config</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Manage tool settings.</p>
      </div>
      <Table
        headers={['Tool', 'Type', 'Tokens/Run', 'Enabled']}
        rows={TOOL_REGISTRY.map((tool) => [
          <Link key={tool.id} href={`/admin/tools/${tool.id}`} className="text-red-300 hover:text-red-200">
            {tool.name}
          </Link>,
          tool.type,
          tool.tokensPerRun,
          tool.enabled ? 'Yes' : 'No',
        ])}
      />
    </section>
  )
}
