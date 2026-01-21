'use client'

import { useMemo, useState } from 'react'
import type { ToolUiItem } from '@/src/lib/ui/types'
import type { RunResponse, RunLock } from '@/src/lib/tools/runTypes'
import { Button } from '@/src/components/ui/Button'
import { ToolRunForm } from '@/src/components/tools/ToolRunForm'
import { RunResultPanel } from '@/src/components/tools/RunResultPanel'
import { RunErrorPanel } from '@/src/components/tools/RunErrorPanel'
import { ToolFeedbackPanel } from '@/src/components/tools/ToolFeedbackPanel'

type ToolPageClientProps = {
  tool: ToolUiItem
  mode?: string
  trialMode?: string
}

export function ToolPageClient({ tool, mode, trialMode }: ToolPageClientProps) {
  const [result, setResult] = useState<RunResponse | null>(null)
  const [lock, setLock] = useState<RunLock | null>(null)
  const [error, setError] = useState<{ message: string } | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [bonusRemaining, setBonusRemaining] = useState(tool.bonusRunsRemaining ?? 0)

  const runMode = (mode === 'trial' ? 'trial' : 'paid') as 'trial' | 'paid'
  const canRun = useMemo(() => {
    if (runMode !== 'trial') return true
    if (tool.lockState === 'trial' && bonusRemaining <= 0) return false
    return true
  }, [bonusRemaining, runMode, tool.lockState])

  const handleRun = async (input: Record<string, any>) => {
    setLoading(true)
    setError(null)
    setLock(null)
    setValidationErrors({})
    try {
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id, mode: runMode, trialMode, input }),
      })
      const rawBody = await res.text()
      const isJson = res.headers.get('content-type')?.includes('application/json')
      let data: RunResponse | undefined

      if (rawBody && isJson) {
        try {
          data = JSON.parse(rawBody) as RunResponse
        } catch (parseError) {
          console.error('[ToolPageClient] Failed to parse run response:', parseError)
        }
      }

      if (!data) {
        setError({ message: 'Request failed with empty response.' })
        return
      }

      if (data.status === 'locked') {
        setLock(data.lock ?? null)
        return
      }
      if (data.status === 'error') {
        if (data.error?.code === 'VALIDATION_ERROR') {
          setValidationErrors(data.error.details || {})
        }
        setError({ message: data.error?.message || 'Run failed' })
        return
      }

      setResult(data)
      if (typeof data.metering?.remainingBonusRuns === 'number') {
        setBonusRemaining(data.metering.remainingBonusRuns)
      }
    } catch (err: any) {
      console.error('[ToolPageClient] Run failed:', err)
      setError({ message: err?.message || 'Run failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {bonusRemaining > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
          Bonus sandbox runs: {bonusRemaining} remaining
        </div>
      )}

      <ToolRunForm
        toolId={tool.id}
        mode={runMode}
        trialMode={trialMode}
        onRun={handleRun}
        loading={loading}
        disabled={!canRun}
        validationErrors={validationErrors}
      />

      <RunErrorPanel lock={lock} error={error} />
      <RunResultPanel result={result} />

      {runMode === 'trial' && (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
          <p className="text-xs uppercase text-[hsl(var(--muted))]">Export / Save</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" disabled>Export PDF</Button>
            <Button variant="outline" disabled>Save Run</Button>
          </div>
        </div>
      )}

      <ToolFeedbackPanel
        toolId={tool.id}
        eligible={tool.lockState === 'trial' && bonusRemaining <= 0}
        onGranted={setBonusRemaining}
      />

      {runMode === 'trial' && !canRun && (
        <RunErrorPanel
          lock={{
            code: 'locked_trial',
            message: 'No sandbox runs remaining.',
            cta: { type: 'upgrade', href: '/pricing' },
          }}
        />
      )}
    </div>
  )
}
