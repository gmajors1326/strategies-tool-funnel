import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export const metadata = {
  title: 'Retention Leak Finder | The Strategy Tools',
  description: 'Find where viewers drop off and why.',
}

export default function RetentionLeakFinderPage() {
  const config = getToolConfig('retention_leak_finder')

  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
