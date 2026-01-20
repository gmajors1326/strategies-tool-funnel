import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export const metadata = {
  title: 'Algorithm Training Mode | The Strategy Tools',
  description: 'Analyze how well your content trains the algorithm.',
}

export default function AlgorithmTrainingModePage() {
  const config = getToolConfig('algorithm_training_mode')

  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
