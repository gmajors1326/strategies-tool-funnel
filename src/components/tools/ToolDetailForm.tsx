'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/src/components/ui/Button'
import { Input } from '@/components/app/Input'
import type { FieldDef, ToolSchemaDef } from '@/src/lib/tools/toolSchemas'

type Props = {
  toolId: string
  toolName: string
  description?: string
  schemaDef: ToolSchemaDef | null
  defaultMode?: 'paid' | 'trial'
  defaultTrialMode?: 'sandbox' | 'preview' | 'live'
}

type RunResponse =
  | { status: 'ok'; runId: string; data?: any; metering?: any }
  | { status: 'locked'; lock: any }
  | { status: 'error'; error?: any }

function classTextarea() {
  return 'w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted))] outline-none'
}

function coerceValue(field: FieldDef, raw: any) {
  if (field.type === 'number') {
    if (raw === '' || raw === null || raw === undefined) return undefined
    const n = Number(raw)
    return Number.isFinite(n) ? n : undefined
  }
  if (field.type === 'boolean') return Boolean(raw)
  return raw
}

function buildInitialValues(fields: FieldDef[]) {
  const initial: Record<string, any> = {}
  for (const f of fields) {
    if (f.defaultValue !== undefined) initial[f.name] = f.defaultValue
    else initial[f.name] = f.type === 'boolean' ? false : ''
  }
  return initial
}

export default function ToolDetailForm({
  toolId,
  toolName,
  description,
  schemaDef,
  defaultMode = 'paid',
  defaultTrialMode = 'sandbox',
}: Props) {
  const [mode, setMode] = useState<'paid' | 'trial'>(defaultMode)
  const [trialMode, setTrialMode] = useState<'sandbox' | 'preview' | 'live'>(defaultTrialMode)

  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<RunResponse | null>(null)

  const [jsonFallback, setJsonFallback] = useState<string>('{}')

  const fields = useMemo(() => schemaDef?.fields ?? [], [schemaDef])
  const schema = schemaDef?.schema ?? null

  const [values, setValues] = useState<Record<string, any>>(() => buildInitialValues(fields))

  const parsedInput = useMemo(() => {
    if (!schemaDef) return null
    const input: Record<string, any> = {}
    for (const f of fields) input[f.name] = coerceValue(f, values[f.name])
    return input
  }, [schemaDef, fields, values])

  const handleRun = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      let input: any

      if (schema && parsedInput) {
        const safe = schema.safeParse(parsedInput)
        if (!safe.success) {
          setResult({
            status: 'error',
            error: {
              message: 'Validation failed',
              code: 'VALIDATION_ERROR',
              details: safe.error.flatten(),
            },
          })
          setIsRunning(false)
          return
        }
        input = safe.data
      } else {
        // JSON fallback
        try {
          input = JSON.parse(jsonFallback || '{}')
        } catch {
          setResult({ status: 'error', error: { message: 'Invalid JSON input', code: 'INVALID_JSON' } })
          setIsRunning(false)
          return
        }
      }

      const body: any = {
        toolId,
        mode,
        input,
      }
      if (mode === 'trial') body.trialMode = trialMode

      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const rawBody = await res.text()
      const isJson = res.headers.get('content-type')?.includes('application/json')
      let data: RunResponse | undefined

      if (rawBody && isJson) {
        try {
          data = JSON.parse(rawBody) as RunResponse
        } catch (parseError) {
          console.error('[ToolDetailForm] Failed to parse run response:', parseError)
        }
      }

      if (!data) {
        setResult({
          status: 'error',
          error: { message: 'Request failed with empty response.', code: 'EMPTY_RESPONSE' },
        })
        setIsRunning(false)
        return
      }

      setResult(data)
    } catch (e: any) {
      setResult({ status: 'error', error: { message: e?.message || 'Request failed', code: 'NETWORK_ERROR' } })
    } finally {
      setIsRunning(false)
    }
  }

  const renderField = (f: FieldDef) => {
    const v = values[f.name]

    if (f.type === 'textarea') {
      return (
        <textarea
          value={v ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
          placeholder={f.placeholder}
          className={classTextarea()}
          rows={4}
        />
      )
    }

    if (f.type === 'select') {
      return (
        <select
          value={v ?? ''}
          onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
          className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none"
        >
          {(f.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )
    }

    if (f.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 text-sm text-[hsl(var(--muted))]">
          <input
            type="checkbox"
            checked={Boolean(v)}
            onChange={(e) => setValues((prev) => ({ ...prev, [f.name]: e.target.checked }))}
          />
          {f.label}
        </label>
      )
    }

    // number / text via Input
    const inputType = f.type === 'number' ? 'number' : 'text'
    return (
      <Input
        value={v ?? ''}
        onChange={(e: any) => setValues((prev) => ({ ...prev, [f.name]: e.target.value }))}
        placeholder={f.placeholder}
        type={inputType as any}
      />
    )
  }

  const renderResult = () => {
    if (!result) return 'Results will appear here.'

    if (result.status === 'ok') {
      return (
        <div className="space-y-2">
          <div className="text-xs">
            <span className="text-[hsl(var(--muted))]">Run ID:</span> {result.runId}
          </div>
          <pre className="overflow-auto rounded-md bg-[hsl(var(--surface-4))] p-3 text-xs text-[hsl(var(--muted))]">
            {JSON.stringify(result.data ?? result, null, 2)}
          </pre>
        </div>
      )
    }

    if (result.status === 'locked') {
      const lock = result.lock
      return (
        <div className="space-y-2">
          <div className="text-sm">{lock?.message ?? 'Locked'}</div>
          {lock?.cta?.href ? (
            <a
              href={lock.cta.href}
              className="inline-flex items-center rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-xs text-[hsl(var(--muted))] hover:bg-[hsl(var(--surface-4))]"
            >
              {lock?.cta?.type ?? 'Next step'}
            </a>
          ) : null}
          <pre className="overflow-auto rounded-md bg-[hsl(var(--surface-4))] p-3 text-xs text-[hsl(var(--muted))]">
            {JSON.stringify(lock ?? result, null, 2)}
          </pre>
        </div>
      )
    }

    return (
      <div className="space-y-2">
        <div className="text-sm">{result.error?.message ?? 'Error'}</div>
        <pre className="overflow-auto rounded-md bg-[hsl(var(--surface-4))] p-3 text-xs text-[hsl(var(--muted))]">
          {JSON.stringify(result.error ?? result, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase text-[hsl(var(--muted))]">Tool</p>
          <h1 className="text-lg font-semibold">{toolName}</h1>
          {description ? <p className="text-sm text-[hsl(var(--muted))]">{description}</p> : null}
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

      {/* Inputs */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
        <p className="text-xs uppercase text-[hsl(var(--muted))]">Inputs</p>

        {schemaDef ? (
          <div className="space-y-3">
            {fields.map((f) => (
              <div key={f.name} className="space-y-1">
                <div className="text-xs text-[hsl(var(--muted))]">{f.label}</div>
                {renderField(f)}
                {f.help ? <div className="text-[11px] text-[hsl(var(--muted))]">{f.help}</div> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-xs text-[hsl(var(--muted))]">
              No schema yet for this tool. Paste JSON input below.
            </div>
            <textarea
              value={jsonFallback}
              onChange={(e) => setJsonFallback(e.target.value)}
              className={classTextarea()}
              rows={8}
            />
          </div>
        )}

        <Button onClick={handleRun} disabled={isRunning} className="w-full">
          {isRunning ? 'Running…' : 'Run Tool'}
        </Button>
      </div>

      {/* Output */}
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
        <p className="mb-2 text-xs uppercase text-[hsl(var(--muted))]">Output</p>
        {renderResult()}
      </div>
    </div>
  )
}
