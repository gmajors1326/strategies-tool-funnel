import Link from 'next/link'
import { fetchUiConfig } from '@/src/lib/ui/fetchUiConfig'
import { ToolCard } from '@/src/components/tools/ToolCard'
import { Button } from '@/src/components/ui/Button'

export const dynamic = 'force-dynamic'

export default async function AppHomePage() {
  const uiConfig = await fetchUiConfig()

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">My Tools</h1>
          <p className="text-sm text-[hsl(var(--muted))]">
            Tools available for your plan and usage state.
          </p>
        </div>
        <Link href="/app/explore">
          <Button variant="outline">Explore tools</Button>
        </Link>
      </div>

      {uiConfig.myTools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6 text-center text-sm text-[hsl(var(--muted))]">
          No tools unlocked yet. Explore the catalog to start a trial.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {uiConfig.myTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      )}
    </section>
  )
}
