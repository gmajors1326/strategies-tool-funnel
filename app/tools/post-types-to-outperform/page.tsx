import { PostTypeDecisionEngine } from '@/components/tools/PostTypeDecisionEngine'

export const metadata = {
  title: 'Post Types To Outperform | The Strategy Tools',
  description: 'Map your growth goal to the exact post type and execution rules that deliver results.',
}

export default function PostTypesToOutperformPage() {
  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <PostTypeDecisionEngine />
    </div>
  )
}
