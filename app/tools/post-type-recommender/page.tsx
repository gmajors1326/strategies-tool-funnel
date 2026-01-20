import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export const metadata = {
  title: 'Post Type Recommender | The Strategy Tools',
  description: 'Get the exact post type to deploy next based on your growth goal.',
}

export default function PostTypeRecommenderPage() {
  const config = getToolConfig('post_type_recommender')

  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
