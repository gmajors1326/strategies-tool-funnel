import { ToolShell } from '@/components/tools/ToolShell'
import { getToolConfig } from '@/lib/ai/toolRegistry'

export const metadata = {
  title: 'Hook Pressure Test | The Strategy Tools',
  description: 'Test if your hook will stop the scroll.',
}

export default function HookPressureTestPage() {
  const config = getToolConfig('hook_pressure_test')

  return (
    <div className="min-h-screen bg-[#7d9b76] py-8">
      <ToolShell config={config} />
    </div>
  )
}
