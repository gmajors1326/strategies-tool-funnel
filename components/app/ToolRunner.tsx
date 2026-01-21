'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/app/Button'
import { Input } from '@/components/app/Input'

type ToolRunnerProps = {
  toolId: string
}

type RunOk = {
  status: 'ok'
  runId: string
  data?: any
  metering?: {
    chargedTokens: number
    remainingTokens: number
    aiTokensUsed: number
    aiTokensCap: number
    runsUsed: number
    runsCap: number
    resetsAtISO: string
    meteringMode: 'tokens' | 'bonus_run' | 'trial'
    remainingBonusRuns?: number
    orgId?: string | null
  }
}

type RunLocked = {
  status: 'locked'
  lock: {
    code: string
    message: string
    cta?: { type: string; href?: string }
    requiredTokens?: number
    remainingTokens?: number
    usage?: {
      runsUsed: number
      runsCap: number
      aiTokensUsed: number
      aiTokensCap: number
      toolRunsUsed?: number
      toolRunsCap?: number
    }
    resetsAtISO?: string
  }
}

type RunError = {
  status: 'error'
  error?: { message?: string; code?: string; details?: any }
}

type RunResponse = RunOk | RunLocked | RunError

function formatReset(resetsAtISO?: string) {
  if (!resetsAtISO) return null
  const d = new Date(resetsAtISO)
  return d.toLocaleString()
}

function lockCtaLabel(code: string) {
  switch (code) {
    case 'locked_tokens':
      return 'Buy tokens'
    case 'locked_plan':
      return 'Upgrade'
    case 'locked_trial':
      return 'Upgrade'
    case 'locked_usage_daily':
    case 'locked_tool_daily':
      return 'View usage'
    case 'locked_role':
      return 'Manage seats'
    default:
      return 'Learn more'
  }
}

function lockCtaHref(lock: RunLocked['lock']) {
  const code = lock.code
  const href = lock.cta?.href
  if (href) return href
  switch (code) {
    case 'locked_tokens':
    case 'locked_plan':
    case 'locked_trial':
      return '/pricing'
    case 'locked_usage_daily':
    case 'locked_tool_daily':
      return '/app/usage'
    case 'locked_role':
      return '/app/account'
    default:
      return '/app/support'
  }
}

export function ToolRunner({ toolId }: ToolRunnerProps) {
  const [mode, setMode] = useState<'paid' | 'trial'>('paid')
  const [trialMode, setTrialMode] = useState<'sandbox' | 'live' | 'preview'>('sandbox')

  const [note, setNote] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<RunResponse | null>(null)

  const payload = useMemo(() => {
    // Placeholder input for now. Keep it explicit so it’s not “lying UI”.
    // When schema-driven inputs land, replace this with validated fields per tool.
    const input = {
      note: note || 'placeholder',
    }

    return {
      toolId,
      mode,
      trialMode: mode === 'trial' ? trialMode : undefined,
      input,
    }
  }, [toolId, mode, trialMode, note])

  const handleRun = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as RunResponse
      setResult(data)
    } catch (e: any) {
      setResult({
        status: 'error',
        error: { message: e?.message || 'Request failed', code: 'NETWORK_ERROR' },
      })
    } finally {
      setIsRunning(false)
    }
  }

  const renderResult = () => {
    if (!result) return 'Results will appear here.'

    if (result.status === 'ok') {
      const m = result.metering
      return (
        <div className="space-y-2">
          <div className="text-xs">
            <span className="text-[hsl(var(--muted))]">Run ID:</span> {result.runId}
          </div>

          {m ? (
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-[hsl(var(--muted))]">Metering:</span> {m.meteringMode}
              </div>
              <div>
                <span className="text-[hsl(var(--muted))]">Tokens charged:</span> {m.chargedTokens} ·{' '}
                <span className="text-[hsl(var(--muted))]">Remaining:</span> {m.remainingTokens}
              </div>
              <div>
                <span className="text-[hsl(var(--muted))]">Daily runs:</span> {m.runsUsed}/{m.runsCap} ·{' '}
                <span className="text-[hsl(var(--muted))]">Daily AI tokens:</span> {m.aiTokensUsed}/{m.aiTokensCap}
              </div>
              {typeof m.remainingBonusRuns === 'number' ? (
                <div>
                  <span className="text-[hsl(var(--muted))]">Bonus runs remaining:</span> {m.remainingBonusRuns}
                </div>
              ) : null}
              <div>
                <span className="text-[hsl(var(--muted))]">Resets:</span> {formatReset(m.resetsAtISO)}
              </div>
            </div>
          ) : (
            <div className="text-xs text-[hsl(var(--muted))]">No metering info returned.</div>
          )}
        </div>
      )
    }

    if (result.status === 'locked') {
      const lock = result.lock
      const href = lockCtaHref(lock)
      const label = lockCtaLabel(lock.code)

      return (
        <div className="space-y-2">
          <div className="text-xs">
            <span className="inline-flex rounded-md bg-[hsl(var(--surface-4))] px-2 py-1 text-[10px] uppercase text-[hsl(var(--muted))]">
              Locked
            </span>
          </div>

          <div className="text-sm">{lock.message}</div>

          {lock.usage ? (
            <div className="text-xs text-[hsl(var(--muted))]">
              Runs: {lock.usage.runsUsed}/{lock.usage.runsCap} · Tokens: {lock.usage.aiTokensUsed}/{lock.usage.aiTokensCap}
              {typeof lock.usage.toolRunsUsed === 'number' && typeof lock.usage.toolRunsCap === 'number'
                ? ` · This tool: ${lock.usage.toolRunsUsed}/${lock.usage.toolRunsCap}`
                : ''}
            </div>
          ) : null}

          {lock.requiredTokens != null ? (
            <div className="text-xs text-[hsl(var(--muted))]">
              Required: {lock.requiredTokens} · You have: {lock.remainingTokens ?? 0}
            </div>
          ) : null}

          {lock.resetsAtISO ? (
            <div className="text-xs text-[hsl(var(--muted))]">Resets: {formatReset(lock.resetsAtISO)}</div>
          ) : null}

          <div className="pt-1">
            <a
              href={href}
              className="inline-flex items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-xs text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-4))]"
            >
              {label}
            </a>
          </div>

          <div className="text-[10px] uppercase tracking-wide text-[hsl(var(--muted))]">Code: {lock.code}</div>
        </div>
      )
    }

    // error
    return (
      <div className="space-y-2">
        <div className="text-xs">
          <span className="inline-flex rounded-md bg-[hsl(var(--surface-4))] px-2 py-1 text-[10px] uppercase text-[hsl(var(--muted))]">
            Error
          </span>
        </div>
        <div className="text-sm">{result.error?.message || 'Something went wrong.'}</div>
        {result.error?.code ? <div className="text-xs text-[hsl(var(--muted))]">Code: {result.error.code}</div> : null}
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase text-[hsl(var(--muted))]">Tool Runner</p>
          <p className="text-sm">Tool: <span className="text-[hsl(var(--foreground))]">{toolId}</span></p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('paid')}
            className={`rounded-md px-2 py-1 text-xs ${
              mode === 'paid'
                ? 'bg-[hsl(var(--surface-4))] text-[hsl(var(--foreground))]'
                : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--muted))]'
            }`}
          >
            Paid
          </button>
          <button
            type="button"
            onClick={() => setMode('trial')}
            className={`rounded-md px-2 py-1 text-xs ${
              mode === 'trial'
                ? 'bg-[hsl(var(--surface-4))] text-[hsl(var(--foreground))]'
                : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--muted))]'
            }`}
          >
            Trial
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase text-[hsl(var(--muted))]">Inputs</p>
        <Input
          value={note}
          onChange={(e: any) => setNote(e.target.value)}
          placeholder="Temporary input. Schema-driven inputs come next."
        />
        {mode === 'trial' ? (
          <div className="flex gap-2">
            {(['sandbox', 'preview', 'live'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTrialMode(m)}
                className={`rounded-md px-2 py-1 text-xs ${
                  trialMode === m
                    ? 'bg-[hsl(var(--surface-4))] text-[hsl(var(--foreground))]'
                    : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--muted))]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        ) : null}
        <div className="text-[11px] text-[hsl(var(--muted))]">
          Note: this runner is wired to real metering. The input UI is intentionally minimal until schemas land.
        </div>
      </div>

      <Button onClick={handleRun} disabled={isRunning}>
        {isRunning ? 'Running…' : 'Run Tool'}
      </Button>

      <div className="rounded-md bg-[hsl(var(--surface-3))] p-3 text-xs text-[hsl(var(--muted))]">
        {renderResult()}
      </div>
    </div>
  )
}
