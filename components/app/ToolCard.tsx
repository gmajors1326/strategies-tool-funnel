import Link from 'next/link'
import type { UiConfigTool } from '@/src/lib/mock/data'
import { StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/app/Button'

type ToolCardProps = {
  tool: UiConfigTool
}

export function ToolCard({ tool }: ToolCardProps) {
  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-gradient-to-br from-[#2f4f3a] via-[#3f6a4d] to-[#5b8a60] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[hsl(var(--text))]">{tool.name}</p>
          <p className="text-xs text-[hsl(var(--muted))] capitalize">{tool.aiLevel}</p>
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
        <div className="flex flex-col gap-2">
          <Link href={`/app/tools/${tool.id}`} className="block">
            <Button className="w-full bg-[#7ee6a3] text-[#0f2d1b] hover:bg-[#98efb6]">Open Tool</Button>
          </Link>
          <Link href="/help" className="block">
            <Button className="w-full" variant="outline">
              Learn more
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
