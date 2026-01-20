import { getMockAnalytics } from '@/src/lib/mock/data'
import { Table } from '@/components/app/Table'

export const dynamic = 'force-dynamic'

export default function AdminAnalyticsPage() {
  const analytics = getMockAnalytics()

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="text-sm text-[hsl(var(--muted))]">KPI and trend overview.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {analytics.kpis.map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
            <p className="text-xs text-[hsl(var(--muted))]">{kpi.label}</p>
            <p className="text-lg font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
          <p className="text-sm font-semibold">Runs by Day</p>
          <div className="mt-3 h-40 rounded-md bg-[hsl(var(--surface-3))] flex items-center justify-center text-xs text-[hsl(var(--muted))]">
            Chart placeholder
          </div>
        </div>
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
          <p className="text-sm font-semibold">Token Usage</p>
          <div className="mt-3 h-40 rounded-md bg-[hsl(var(--surface-3))] flex items-center justify-center text-xs text-[hsl(var(--muted))]">
            Chart placeholder
          </div>
        </div>
      </div>

      <Table
        headers={['Tool', 'Runs']}
        rows={analytics.tables.topTools.map((row) => [row.tool, row.runs])}
      />
    </section>
  )
}
