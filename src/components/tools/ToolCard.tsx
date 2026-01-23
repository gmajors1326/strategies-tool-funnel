import Link from 'next/link'
import type { ToolUiItem } from '@/src/lib/ui/types'
import { ToolBadges } from '@/src/components/tools/ToolBadges'
import { Button } from '@/src/components/ui/Button'
import { getLaunchMeta } from '@/src/lib/tools/launchTools'

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
  const meta = getLaunchMeta(tool.id)

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-gradient-to-br from-[#2f4f3a] via-[#3f6a4d] to-[#5b8a60] p-4 space-y-3">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-[11px] text-[hsl(var(--muted))]">
          {meta?.label ? (
            <span className="rounded-full border border-[hsl(var(--border))] px-2 py-0.5">{meta.label}</span>
          ) : null}
          {meta?.startHere ? (
            <span className="rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-2 py-0.5 text-[hsl(var(--text))]">
              Start here
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold leading-tight">{tool.name}</p>
        {meta?.promise ? <p className="text-xs text-[hsl(var(--muted))]">{meta.promise}</p> : null}
        <ToolBadges category={tool.category} aiLevel={tool.aiLevel} lockState={tool.lockState} />
      </div>
      {meta?.outputs?.length ? (
        <div className="text-xs text-[hsl(var(--muted))]">
          Outputs:{' '}
          {meta.outputs.map((out) => (
            <span key={out} className="mr-1 inline-flex items-center rounded-md border border-[hsl(var(--border))] px-2 py-0.5">
              {out}
            </span>
          ))}
        </div>
      ) : null}

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
