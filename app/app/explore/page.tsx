import { listTools } from '@/src/lib/tools/registry'
import ExploreTools from '@/src/components/tools/ExploreTools'

export default function ExplorePage() {
  const tools = listTools({ includeHidden: false })

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <ExploreTools tools={tools} />
    </div>
  )
}
