import { EmptyState } from '@/components/app/EmptyState'

export const dynamic = 'force-dynamic'

export default function HistoryPage() {
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Run History</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Recent tool runs will appear here.</p>
      </div>
      <EmptyState title="No history yet" description="Run a tool to start tracking history." />
    </section>
  )
}
