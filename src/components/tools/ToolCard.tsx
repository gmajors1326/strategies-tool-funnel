import Link from 'next/link'
import type { ToolUiItem } from '@/src/lib/ui/types'
import { ToolBadges } from '@/src/components/tools/ToolBadges'
import { Button } from '@/src/components/ui/Button'

type ToolCardProps = {
  tool: ToolUiItem
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
      <div className="space-y-2">
        <p className="text-sm font-semibold">{tool.name}</p>
        <ToolBadges category={tool.category} aiLevel={tool.aiLevel} lockState={tool.lockState} />
      </div>
      {tool.reason && <p className="text-xs text-[hsl(var(--muted))]">{tool.reason}</p>}
      {tool.bonusRunsRemaining !== undefined && tool.bonusRunsRemaining > 0 && (
        <p className="text-xs text-[hsl(var(--muted))]">
          Bonus sandbox runs: {tool.bonusRunsRemaining}
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
        <span>{tool.tokensPerRun ? `${tool.tokensPerRun} tokens/run` : 'No tokens'}</span>
        {tool.runsRemainingToday !== undefined && (
          <span>{tool.runsRemainingToday} runs left</span>
        )}
      </div>
      <Link href={tool.cta.href} className="block">
        <Button className="w-full">{tool.cta.label}</Button>
      </Link>
    </div>
  )
}
