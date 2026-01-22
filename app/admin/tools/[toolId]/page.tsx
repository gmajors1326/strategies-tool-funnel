import { notFound } from 'next/navigation'
import { getToolMeta } from '@/src/lib/tools/registry'
import { Button } from '@/components/app/Button'
import { Input } from '@/components/app/Input'

export const dynamic = 'force-dynamic'

export default async function AdminToolConfigPage({ params }: { params: { toolId: string } }) {
  let tool
  try {
    tool = getToolMeta(params.toolId)
  } catch {
    return notFound()
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold">{tool.name}</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Tool configuration editor.</p>
      </div>
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <label className="text-xs text-[hsl(var(--muted))]">Tokens Per Run</label>
        <Input defaultValue={tool.tokensPerRun} />
        <label className="text-xs text-[hsl(var(--muted))]">Daily Runs by Plan</label>
        <div className="grid gap-2 md:grid-cols-2">
          {Object.entries(tool.dailyRunsByPlan).map(([plan, runs]) => (
            <Input key={plan} defaultValue={`${plan}: ${runs}`} />
          ))}
        </div>
        <Button>Save Config</Button>
      </div>
    </section>
  )
}
