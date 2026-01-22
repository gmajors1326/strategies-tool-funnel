import { listTools } from '@/src/lib/tools/registry'
import ExploreTools from '@/src/components/tools/ExploreTools'

export default function ExplorePage() {
  const tools = listTools({ includeHidden: false })

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-100">Explore Tools</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Filter by category, difficulty, and tags. Badges reflect your plan + caps + token balance.
        </p>
      </div>

      <ExploreTools tools={tools} />
    </div>
  )
}
