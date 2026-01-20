import type { RunResponse } from '@/src/lib/tools/runTypes'

type RunResultPanelProps = {
  result?: RunResponse | null
}

export function RunResultPanel({ result }: RunResultPanelProps) {
  if (!result || !result.data) {
    return (
      <div className="rounded-xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] p-4 text-xs text-[hsl(var(--muted))]">
        Results will appear here after a successful run.
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
      <p className="text-xs uppercase text-[hsl(var(--muted))]">Result</p>
      <pre className="whitespace-pre-wrap text-xs text-[hsl(var(--text))]">
        {JSON.stringify(result.data, null, 2)}
      </pre>
    </div>
  )
}
