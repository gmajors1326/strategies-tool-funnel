import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export const metadata = {
  title: 'Why This Post Failed | The Strategy Tools',
  description: 'Diagnose why a post underperformed and get one focused fix.',
}

export default function WhyPostFailedPage() {
  const config = getToolConfig('why_post_failed')

  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
