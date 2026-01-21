import Link from 'next/link'
import type { ToolUiItem } from '@/src/lib/ui/types'
import { ToolBadges } from '@/src/components/tools/ToolBadges'
import { Button } from '@/src/components/ui/Button'

type ToolCardProps = {
  tool: ToolUiItem
}

function resolveCta(tool: ToolUiItem) {
  // Explicit CTA from backend / computeToolStatus wins
  if (tool.cta) return tool.cta

  switch (tool.lockState) {
    case 'available':
      return { label: 'Run tool', href: `/app/tools/${tool.id}` }

    case 'trial':
      return { label: 'Start trial', href: `/app/tools/${tool.id}?mode=trial` }

    case 'limited':
      return { label: 'View usage', href: '/app/usage' }

    case 'disabled':
    default:
      return { label: 'Upgrade', href: '/pricing' }
  }
}

export function ToolCard({ tool }: ToolCardProps) {
  const cta = resolveCta(tool)

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
      {/* Header */}
      <div className="space-y-2">
        <p className="text-sm font-semibold leading-tight">{tool.name}</p>
        <ToolBadges category={tool.category} aiLevel={tool.aiLevel} lockState={tool.lockState} />
      </div>

      {/* Reason / explanation */}
      {tool.reason && <p className="text-xs text-[hsl(var(--muted))]">{tool.reason}</p>}

      {/* Bonus runs */}
      {typeof tool.bonusRunsRemaining === 'number' && tool.bonusRunsRemaining > 0 && (
        <p className="text-xs text-[hsl(var(--muted))]">Bonus sandbox runs: {tool.bonusRunsRemaining}</p>
      )}

      {/* Metering */}
      <div className="flex items-center justify-between text-xs text-[hsl(var(--muted))]">
        <span>{tool.tokensPerRun && tool.tokensPerRun > 0 ? `${tool.tokensPerRun} tokens/run` : 'No tokens'}</span>

        {typeof tool.runsRemainingToday === 'number' && <span>{tool.runsRemainingToday} runs left</span>}
      </div>

      {/* CTA */}
      <Link href={cta.href} className="block">
        <Button className="w-full" variant={tool.lockState === 'available' || tool.lockState === 'trial' ? 'primary' : 'outline'}>
          {cta.label}
        </Button>
      </Link>
    </div>
  )
}
