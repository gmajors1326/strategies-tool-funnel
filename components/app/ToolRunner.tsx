'use client'

import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/app/Button'
import { Input } from '@/components/app/Input'
import { getToolMeta, type ToolField } from '@/src/lib/tools/registry'

type ToolRunnerProps = {
  toolId: string
  defaultMode?: 'paid' | 'trial'
  defaultTrialMode?: 'sandbox' | 'live' | 'preview'
  planId?: 'free' | 'pro_monthly' | 'team' | 'lifetime'
  onResult?: (result: any) => void
}

type RunOk = {
  status: 'ok'
  runId: string
  output?: any
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

function classTextarea() {
  return 'w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted))] outline-none'
}

function coerceValue(field: ToolField, raw: any) {
  if (field.type === 'number') {
    if (raw === '' || raw === null || raw === undefined) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  if (field.type === 'toggle') return Boolean(raw)
  return raw
}

function buildInitialValues(fields: ToolField[]) {
  const initial: Record<string, any> = {}
  for (const f of fields) {
    if (f.defaultValue !== undefined) initial[f.key] = f.defaultValue
    else if (f.type === 'toggle') initial[f.key] = false
    else if (f.type === 'multiSelect') initial[f.key] = []
    else initial[f.key] = ''
  }
  return initial
}

export default function ToolRunner({
  toolId,
  defaultMode = 'paid',
  defaultTrialMode = 'sandbox',
  planId,
  onResult,
}: ToolRunnerProps) {
  const tool = useMemo(() => getToolMeta(toolId), [toolId])
  const [trialMode, setTrialMode] = useState<'sandbox' | 'live' | 'preview'>(defaultTrialMode)
  const [values, setValues] = useState<Record<string, any>>(() => buildInitialValues(tool.fields))
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<RunResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const effectiveMode: 'paid' | 'trial' = planId ? (planId === 'free' ? 'trial' : 'paid') : defaultMode

  useEffect(() => {
    setValues(buildInitialValues(tool.fields))
    setResult(null)
    setError(null)
  }, [toolId, tool.fields])

  const validate = () => {
    const issues: string[] = []
    for (const f of tool.fields) {
      if (!f.required) continue
      const v = values[f.key]
      const empty =
        v === null ||
        v === undefined ||
        (typeof v === 'string' && v.trim() === '') ||
        (Array.isArray(v) && v.length === 0)
      if (empty) issues.push(`${f.label} is required`)
    }
    return issues
  }

  const buildPayload = () => {
    const input: Record<string, any> = {}
    for (const f of tool.fields) input[f.key] = coerceValue(f, values[f.key])
    return {
      toolId,
      mode: effectiveMode,
      trialMode: effectiveMode === 'trial' ? trialMode : undefined,
      input,
    }
  }

  const handleRun = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    const issues = validate()
    if (issues.length) {
      setError(issues.join('\n'))
      setIsRunning(false)
      return
    }

    const payload = buildPayload()

    try {
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const rawBody = await res.text()
      const isJson = res.headers.get('content-type')?.includes('application/json')
      let data: RunResponse | undefined

      if (rawBody && isJson) {
        try {
          data = JSON.parse(rawBody) as RunResponse
        } catch (parseError) {
          console.error('[ToolRunner] Failed to parse run response:', parseError)
        }
      }

      if (!data) {
        setResult({
          status: 'error',
          error: { message: 'Request failed with empty response.', code: 'EMPTY_RESPONSE' },
        })
        return
      }

      setResult(data)
      onResult?.(data)
    } catch (e: any) {
      setResult({
        status: 'error',
        error: { message: e?.message || 'Request failed', code: 'NETWORK_ERROR' },
      })
    } finally {
      setIsRunning(false)
    }
  }

  const renderField = (field: ToolField) => {
    const value = values[field.key]

    if (field.type === 'longText') {
      return (
        <textarea
          value={value ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
          placeholder={field.placeholder}
          className={classTextarea()}
          rows={4}
        />
      )
    }

    if (field.type === 'select') {
      return (
        <select
          value={value ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none"
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (field.type === 'multiSelect') {
      const selected = Array.isArray(value) ? value : []
      return (
        <div className="flex flex-wrap gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-2">
          {(field.options ?? []).map((opt) => {
            const active = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  if (active) {
                    setValues((prev) => ({
                      ...prev,
                      [field.key]: selected.filter((item: string) => item !== opt.value),
                    }))
                  } else {
                    setValues((prev) => ({ ...prev, [field.key]: [...selected, opt.value] }))
                  }
                }}
                className={`rounded-full px-3 py-1 text-xs ${
                  active
                    ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                    : 'bg-[hsl(var(--surface-3))] text-[hsl(var(--muted))]'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }

    if (field.type === 'toggle') {
      return (
        <label className="flex items-center gap-2 text-sm text-[hsl(var(--muted))]">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.checked }))}
          />
          {field.placeholder ?? field.label}
        </label>
      )
    }

    const inputType = field.type === 'number' ? 'number' : 'text'
    return (
      <Input
        value={value ?? ''}
        onChange={(e: any) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
        placeholder={field.placeholder}
        type={inputType as any}
      />
    )
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

          <pre className="overflow-auto rounded-md bg-[hsl(var(--surface-4))] p-3 text-xs text-[hsl(var(--muted))]">
            {JSON.stringify(result.output ?? result, null, 2)}
          </pre>

          {m ? (
            <div className="space-y-1 text-xs text-[hsl(var(--muted))]">
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
          ) : null}
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
          <p className="text-xs uppercase text-[hsl(var(--muted))]">Tool</p>
          <p className="text-sm">
            {tool.name} · <span className="text-[hsl(var(--muted))]">{tool.tokensPerRun} tokens/run</span>
          </p>
          <p className="text-xs text-[hsl(var(--muted))]">{tool.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[hsl(var(--surface-4))] px-2 py-1 text-xs text-[hsl(var(--foreground))]">
            {effectiveMode === 'trial' ? 'Trial' : 'Paid'}
          </span>
        </div>
      </div>

      {effectiveMode === 'trial' ? (
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

      <div className="space-y-2">
        <p className="text-xs uppercase text-[hsl(var(--muted))]">Inputs</p>
        <div className="space-y-3">
          {tool.fields.map((field) => (
            <div key={field.key} className="space-y-1">
              <div className="text-xs text-[hsl(var(--muted))]">
                {field.label} {field.required ? <span className="text-red-400">*</span> : null}
              </div>
              {renderField(field)}
              {field.help ? <div className="text-[11px] text-[hsl(var(--muted))]">{field.help}</div> : null}
            </div>
          ))}
        </div>

        {error ? (
          <pre className="whitespace-pre-wrap rounded-md border border-red-900 bg-red-950/40 p-3 text-xs text-red-200">
            {error}
          </pre>
        ) : null}
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
