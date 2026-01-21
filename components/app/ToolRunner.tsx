'use client'

import * as React from 'react'
import type { RunMode, TrialMode, RunResponse } from '@/src/lib/tools/runTypes'
import { getToolMeta, type ToolField } from '@/src/lib/tools/registry'

type Props = {
  toolId: string
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

export default function ToolRunner({ toolId }: Props) {
  const tool = React.useMemo(() => getToolMeta(toolId), [toolId])

  const [mode, setMode] = React.useState<RunMode>('paid')
  const [trialMode, setTrialMode] = React.useState<TrialMode>('sandbox')

  const [values, setValues] = React.useState<Record<string, any>>(() => {
    const init: Record<string, any> = {}
    for (const f of tool.fields) {
      init[f.key] = f.defaultValue ?? (f.type === 'toggle' ? false : f.type === 'multiSelect' ? [] : '')
    }
    return init
  })

  const [loading, setLoading] = React.useState(false)
  const [resp, setResp] = React.useState<RunResponse | null>(null)

  React.useEffect(() => {
    const init: Record<string, any> = {}
    for (const f of tool.fields) {
      init[f.key] = f.defaultValue ?? (f.type === 'toggle' ? false : f.type === 'multiSelect' ? [] : '')
    }
    setValues(init)
    setResp(null)
  }, [toolId])

  function setField(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function validateClientSide(): string[] {
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

  async function run() {
    setResp(null)

    const issues = validateClientSide()
    if (issues.length) {
      setResp({
        status: 'error',
        error: { message: issues.join('\n'), code: 'VALIDATION_ERROR' },
      })
      return
    }

    const input: Record<string, any> = {}
    for (const f of tool.fields) input[f.key] = coerceValue(f, values[f.key])

    const runId = crypto.randomUUID()

    setLoading(true)
    try {
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          mode,
          trialMode: mode === 'trial' ? trialMode : undefined,
          input,
          runId,
        }),
      })

      const data = (await res.json().catch(() => ({}))) as RunResponse
      setResp(data)
    } catch (e: any) {
      setResp({
        status: 'error',
        error: { message: e?.message || 'Request failed', code: 'PROVIDER_ERROR' },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-neutral-100">{tool.name}</div>
            <div className="mt-1 text-sm text-neutral-400">{tool.description}</div>
          </div>

          <div className="text-right text-xs text-neutral-400">
            <div>{tool.tokensPerRun} tokens / run</div>
            <div className="mt-1">
              <span className="rounded-md bg-neutral-900 px-2 py-1">toolId: {tool.id}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="text-xs text-neutral-400">Mode</label>
          <select
            className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
            value={mode}
            onChange={(e) => setMode(e.target.value as RunMode)}
          >
            <option value="paid">Paid</option>
            <option value="trial">Trial</option>
          </select>

          {mode === 'trial' ? (
            <>
              <label className="ml-2 text-xs text-neutral-400">Trial mode</label>
              <select
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
                value={trialMode}
                onChange={(e) => setTrialMode(e.target.value as TrialMode)}
              >
                <option value="sandbox">sandbox</option>
                <option value="preview">preview</option>
                <option value="live">live</option>
              </select>
            </>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          {tool.fields.map((f) => (
            <FieldRenderer key={f.key} field={f} value={values[f.key]} onChange={(v) => setField(f.key, v)} />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={run}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
          >
            {loading ? 'Running…' : 'Run tool'}
          </button>
          <div className="text-xs text-neutral-500">
            Uses server-side validation + metering. If it locks, you’ll see why.
          </div>
        </div>
      </div>

      {resp ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="text-sm font-semibold text-neutral-200">Result</div>

          {resp.status === 'locked' && resp.lock ? (
            <div className="mt-2 rounded-lg border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
              <div className="font-semibold">Locked: {resp.lock.code}</div>
              <div className="mt-1">{resp.lock.message}</div>
              {resp.lock.usage ? (
                <div className="mt-2 text-xs text-yellow-300/90">
                  Runs: {resp.lock.usage.runsUsed}/{resp.lock.usage.runsCap} • Tokens: {resp.lock.usage.aiTokensUsed}/
                  {resp.lock.usage.aiTokensCap}
                </div>
              ) : null}
              {resp.lock.resetsAtISO ? (
                <div className="mt-1 text-xs text-yellow-300/90">Resets: {resp.lock.resetsAtISO}</div>
              ) : null}
            </div>
          ) : null}

          {resp.status === 'error' && resp.error ? (
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {resp.error.message}
              {resp.error.details ? `\n\n${JSON.stringify(resp.error.details, null, 2)}` : ''}
            </pre>
          ) : null}

          {resp.status === 'ok' ? (
            <>
              {resp.metering ? (
                <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-200">
                  <div>Charged: {resp.metering.chargedTokens} tokens</div>
                  <div>Remaining: {resp.metering.remainingTokens}</div>
                  <div>
                    Runs: {resp.metering.runsUsed}/{resp.metering.runsCap} • Tokens: {resp.metering.aiTokensUsed}/
                    {resp.metering.aiTokensCap}
                  </div>
                  <div>Mode: {resp.metering.meteringMode}</div>
                </div>
              ) : null}

              <pre className="mt-3 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-200">
                {JSON.stringify(resp.output, null, 2)}
              </pre>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ToolField
  value: any
  onChange: (v: any) => void
}) {
  const base =
    'w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-600/40'

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-neutral-300">
          {field.label} {field.required ? <span className="text-red-400">*</span> : null}
        </label>
        {field.help ? <span className="text-[11px] text-neutral-500">{field.help}</span> : null}
      </div>

      {field.type === 'shortText' ? (
        <input className={base} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === 'longText' ? (
        <textarea className={base} rows={4} value={value ?? ''} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : field.type === 'number' ? (
        <input
          className={base}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === 'select' ? (
        <select className={base} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(field.options ?? []).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'multiSelect' ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-neutral-800 bg-neutral-900 p-2">
          {(field.options ?? []).map((o) => {
            const arr = Array.isArray(value) ? value : []
            const active = arr.includes(o.value)
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  if (active) onChange(arr.filter((x: string) => x !== o.value))
                  else onChange([...arr, o.value])
                }}
                className={[
                  'rounded-full px-3 py-1 text-xs',
                  active ? 'bg-red-600 text-white' : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700',
                ].join(' ')}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      ) : field.type === 'toggle' ? (
        <label className="flex items-center gap-2 text-sm text-neutral-200">
          <input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />
          <span>{field.placeholder ?? 'Enable'}</span>
        </label>
      ) : null}
    </div>
  )
}
