import Link from 'next/link'
import type { UiConfigTool } from '@/src/lib/mock/data'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/app/Button'

type ToolCardProps = {
  tool: UiConfigTool
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--text))]">{tool.name}</p>
          <p className="text-xs text-[hsl(var(--muted))] capitalize">{tool.type.replace('_', ' ')}</p>
        </div>
        <StatusBadge status={tool.status} />
      </div>
      {tool.reason && (
        <p className="text-xs text-[hsl(var(--muted))]">{tool.reason}</p>
      )}
      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
        <span>{tool.tokensPerRun ? `${tool.tokensPerRun} tokens/run` : 'Tokens TBD'}</span>
        {tool.runsRemainingForTool !== undefined && (
          <span>{tool.runsRemainingForTool} runs left</span>
        )}
      </div>
      {tool.cta ? (
        <Link href={tool.cta.href} className="block">
          <Button className="w-full">{tool.cta.label}</Button>
        </Link>
      ) : (
        <Link href={`/app/tools/${tool.id}`} className="block">
          <Button className="w-full">Open Tool</Button>
        </Link>
      )}
    </div>
  )
}
