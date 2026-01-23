import { listTools } from '@/src/lib/tools/registry'
import ExploreTools from '@/src/components/tools/ExploreTools'
import { isLaunchTool } from '@/src/lib/tools/launchTools'

export default function ExplorePage() {
  const tools = listTools({ includeHidden: false }).filter((tool) => isLaunchTool(tool.id))

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <ExploreTools tools={tools} />
    </div>
  )
}
