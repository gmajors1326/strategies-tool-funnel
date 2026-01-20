import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export const metadata = {
  title: 'Post Types To Outperform | The Strategy Tools',
  description: 'Map your growth goal to the exact post type and execution rules that deliver results.',
}

export default function PostTypesToOutperformPage() {
  const config = getToolConfig('post_types_to_outperform')

  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
