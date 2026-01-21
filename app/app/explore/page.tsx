import { fetchUiConfig } from '@/src/lib/ui/fetchUiConfig'
import { ToolCard } from '@/src/components/tools/ToolCard'

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const uiConfig = await fetchUiConfig()

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Explore Tools</h1>
        <p className="text-sm text-[hsl(var(--muted))]">
          Browse every tool and see what&apos;s unlocked.
        </p>
      </div>
      {uiConfig.catalogTools.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-6 text-center text-sm text-[hsl(var(--muted))]">
          No tools found. If this is production, your registry or access mapping is miswired.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {uiConfig.catalogTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool as any} />
          ))}
        </div>
      )}
    </section>
  )
}
