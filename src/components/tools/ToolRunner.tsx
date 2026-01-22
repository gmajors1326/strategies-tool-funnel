// src/components/tools/ToolRunner.tsx
'use client'

import * as React from 'react'
import type { RunMode, TrialMode, RunResponse } from '@/src/lib/tools/runTypes'
import { getToolMeta, type ToolExample, type ToolMeta } from '@/src/lib/tools/registry'
import { ToolField } from '@/src/components/tools/ToolField'

type Props = {
  toolId: string
  // optional defaults
  defaultMode?: RunMode
  defaultTrialMode?: TrialMode
}

type FieldErrors = Record<string, string>

const LS_KEY = (toolId: string) => `tool_inputs:${toolId}`

function safeJsonParse<T>(s: string | null): T | null {
  if (!s) return null
  try {
    return JSON.parse(s) as T
  } catch {
    return null
  }
}

function toRunInput(tool: ToolMeta, values: Record<string, any>) {
  const input: Record<string, any> = {}
  for (const f of tool.fields) {
    const raw = values[f.key]
    if (f.type === 'number') {
      if (raw === '' || raw === null || raw === undefined) continue
      const n = Number(raw)
      if (Number.isFinite(n)) input[f.key] = n
      continue
    }
    if (f.type === 'toggle') {
      input[f.key] = Boolean(raw)
      continue
    }
    if (f.type === 'multiSelect') {
      input[f.key] = Array.isArray(raw) ? raw : []
      continue
    }
    input[f.key] = raw
  }
  return input
}

function defaultValues(tool: ToolMeta) {
  const init: Record<string, any> = {}
  for (const f of tool.fields) {
    if (f.defaultValue !== undefined) {
      init[f.key] = f.defaultValue
      continue
    }
    if (f.type === 'toggle') init[f.key] = false
    else if (f.type === 'multiSelect') init[f.key] = []
    else init[f.key] = ''
  }
  return init
}

function clientValidate(tool: ToolMeta, values: Record<string, any>): FieldErrors {
  const errs: FieldErrors = {}
  for (const f of tool.fields) {
    if (!f.required) continue
    const v = values[f.key]
    const empty =
      v === null ||
      v === undefined ||
      (typeof v === 'string' && v.trim() === '') ||
      (Array.isArray(v) && v.length === 0) ||
      (f.type === 'number' && (v === '' || !Number.isFinite(Number(v))))
    if (empty) errs[f.key] = `${f.label} is required.`
  }
  return errs
}

function mergeErrors(a: FieldErrors, b: FieldErrors) {
  return { ...a, ...b }
}

function normalizeServerValidation(resp: RunResponse | null): FieldErrors {
  if (!resp || resp.status !== 'error') return {}
  if (resp.error?.code !== 'VALIDATION_ERROR') return {}
  const details = resp.error?.details
  if (!details || typeof details !== 'object') return {}
  // expected shape: { [fieldKey]: message }
  return details as FieldErrors
}

function LockCtaButton({ lock }: { lock: NonNullable<RunResponse['lock']> }) {
  const href = lock.cta?.href || '/pricing'
  const label =
    lock.cta?.type === 'buy_tokens'
      ? 'Buy tokens'
      : lock.cta?.type === 'upgrade'
        ? 'Upgrade'
        : lock.cta?.type === 'wait_reset'
          ? 'View usage'
          : lock.cta?.type === 'contact'
            ? 'Contact support'
            : lock.cta?.type === 'login'
              ? 'Log in'
              : 'Continue'

  return (
    <a
      href={href}
      className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-500"
    >
      {label}
    </a>
  )
}

export default function ToolRunner({ toolId, defaultMode = 'paid', defaultTrialMode = 'sandbox' }: Props) {
  const tool = React.useMemo(() => getToolMeta(toolId), [toolId])

  const [mode, setMode] = React.useState<RunMode>(defaultMode)
  const [trialMode, setTrialMode] = React.useState<TrialMode>(defaultTrialMode)

  const [values, setValues] = React.useState<Record<string, any>>(() => {
    const base = defaultValues(tool)
    const saved = safeJsonParse<Record<string, any>>(typeof window !== 'undefined' ? localStorage.getItem(LS_KEY(tool.id)) : null)
    return saved ? { ...base, ...saved } : base
  })

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({})
  const [preflight, setPreflight] = React.useState<RunResponse | null>(null)
  const [preflightRequestId, setPreflightRequestId] = React.useState<string | null>(null)

  const [running, setRunning] = React.useState(false)
  const [result, setResult] = React.useState<RunResponse | null>(null)
  const [resultRequestId, setResultRequestId] = React.useState<string | null>(null)

  // Reset state when tool changes
  React.useEffect(() => {
    const base = defaultValues(tool)
    const saved = safeJsonParse<Record<string, any>>(typeof window !== 'undefined' ? localStorage.getItem(LS_KEY(tool.id)) : null)
    setValues(saved ? { ...base, ...saved } : base)
    setFieldErrors({})
    setPreflight(null)
    setPreflightRequestId(null)
    setResult(null)
    setResultRequestId(null)
  }, [toolId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist inputs (debounced)
  React.useEffect(() => {
    const t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY(tool.id), JSON.stringify(values))
      } catch {
        // ignore quota / privacy mode
      }
    }, 200)
    return () => clearTimeout(t)
  }, [tool.id, values])

  // Auto preflight (debounced) once required fields are present
  React.useEffect(() => {
    const clientErrs = clientValidate(tool, values)
    setFieldErrors(clientErrs)

    const hasRequired = Object.keys(clientErrs).length === 0
    if (!hasRequired) {
      setPreflight(null)
      setPreflightRequestId(null)
      return
    }

    const t = setTimeout(() => {
      void doPreflight()
    }, 350)

    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.id, mode, trialMode, values])

  function setField(key: string, v: any) {
    setValues((prev) => ({ ...prev, [key]: v }))
  }

  function resetInputs() {
    const base = defaultValues(tool)
    setValues(base)
    setFieldErrors({})
    setPreflight(null)
    setPreflightRequestId(null)
    setResult(null)
    setResultRequestId(null)
    try {
      localStorage.removeItem(LS_KEY(tool.id))
    } catch {}
  }

  function loadExample(ex: ToolExample) {
    const base = defaultValues(tool)
    setValues({ ...base, ...ex.input })
    setResult(null)
    setResultRequestId(null)
  }

  async function doPreflight() {
    const input = toRunInput(tool, values)

    // client validation first (keeps server calm)
    const clientErrs = clientValidate(tool, values)
    if (Object.keys(clientErrs).length) {
      setFieldErrors(clientErrs)
      setPreflight(null)
      setPreflightRequestId(null)
      return
    }

    try {
      const runId = crypto.randomUUID()
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toolId: tool.id,
          mode,
          trialMode: mode === 'trial' ? trialMode : undefined,
          input,
          runId,
          dryRun: true,
        }),
      })

      const requestId = res.headers.get('x-request-id')
      setPreflightRequestId(requestId)

      const json = (await res.json().catch(() => null)) as RunResponse | null
      setPreflight(json)

      // If server sends validation errors, show inline
      const serverErrs = normalizeServerValidation(json)
      if (Object.keys(serverErrs).length) {
        setFieldErrors((prev) => mergeErrors(prev, serverErrs))
      }
    } catch {
      // ignore preflight failures (don’t punish the user for flaky network)
      setPreflight(null)
      setPreflightRequestId(null)
    }
  }

  async function runTool() {
    setResult(null)
    setResultRequestId(null)

    const clientErrs = clientValidate(tool, values)
    const input = toRunInput(tool, values)

    if (Object.keys(clientErrs).length) {
      setFieldErrors(clientErrs)
      setResult({
        status: 'error',
        error: { message: 'Please fix the highlighted fields.', code: 'VALIDATION_ERROR', details: clientErrs },
      })
      return
    }

    setRunning(true)
    try {
      const runId = crypto.randomUUID()
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

      const requestId = res.headers.get('x-request-id')
      setResultRequestId(requestId)

      const json = (await res.json().catch(() => null)) as RunResponse | null
      setResult(json)

      const serverErrs = normalizeServerValidation(json)
      if (Object.keys(serverErrs).length) {
        setFieldErrors((prev) => mergeErrors(prev, serverErrs))
      }
    } catch (e: any) {
      setResult({
        status: 'error',
        error: { message: e?.message || 'Request failed.', code: 'PROVIDER_ERROR' },
      })
    } finally {
      setRunning(false)
    }
  }

  const preflightSummary = React.useMemo(() => {
    if (!preflight) return null
    if (preflight.status === 'locked') {
      return {
        kind: 'locked' as const,
        message: preflight.lock?.message || 'Locked.',
        lock: preflight.lock!,
      }
    }
    if (preflight.status === 'error') {
      return {
        kind: 'error' as const,
        message: preflight.error?.message || 'Error.',
      }
    }
    // ok
    const out: any = preflight.output || {}
    const estimatedTokens = out?.estimatedTokens ?? tool.tokensPerRun
    return {
      kind: 'ok' as const,
      estimatedTokens,
      meteringMode: out?.meteringMode,
      remainingTokens: out?.remainingTokens,
      runsUsed: out?.runsUsed,
      planRunCap: out?.planRunCap,
      aiTokensUsed: out?.aiTokensUsed,
      planTokenCap: out?.planTokenCap,
      toolRunsUsed: out?.toolRunsUsed,
      toolCap: out?.toolCap,
      remainingBonusRuns: out?.remainingBonusRuns,
    }
  }, [preflight, tool.tokensPerRun])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-neutral-100">{tool.name}</div>
            <div className="mt-1 text-sm text-neutral-400">{tool.description}</div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span className="rounded-md bg-neutral-900 px-2 py-1">toolId: {tool.id}</span>
              <span className="rounded-md bg-neutral-900 px-2 py-1">difficulty: {tool.difficulty}</span>
              {tool.tags?.slice(0, 6).map((t) => (
                <span key={t} className="rounded-md bg-neutral-900 px-2 py-1">
                  #{t}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right text-xs text-neutral-400">
            <div className="rounded-md bg-neutral-900 px-2 py-1">{tool.tokensPerRun} tokens / run</div>
            <div className="mt-2">
              <button
                type="button"
                onClick={resetInputs}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-900"
              >
                Reset inputs
              </button>
            </div>
          </div>
        </div>

        {/* Mode controls + examples */}
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

          {tool.examples?.length ? (
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="text-xs text-neutral-400">Examples</label>
              <select
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
                defaultValue=""
                onChange={(e) => {
                  const idx = Number(e.target.value)
                  if (!Number.isFinite(idx) || idx < 0) return
                  loadExample(tool.examples[idx])
                  e.currentTarget.value = ''
                }}
              >
                <option value="" disabled>
                  Load example…
                </option>
                {tool.examples.map((ex, i) => (
                  <option key={ex.label} value={String(i)}>
                    {ex.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  if (tool.examples?.[0]) loadExample(tool.examples[0])
                }}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              >
                Load first
              </button>
            </div>
          ) : null}
        </div>

        {/* Preflight strip */}
        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-neutral-300">
              <span className="font-semibold">Preflight</span>{' '}
              <span className="text-neutral-500">(auto-checks lock + validation before run)</span>
              {preflightRequestId ? (
                <span className="ml-2 text-neutral-500">req: {preflightRequestId}</span>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => void doPreflight()}
              className="rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-800"
            >
              Re-check
            </button>
          </div>

          {!preflightSummary ? (
            <div className="mt-2 text-sm text-neutral-400">Fill required fields to see estimated cost + lock reasons.</div>
          ) : preflightSummary.kind === 'locked' ? (
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-yellow-200">
                <span className="font-semibold">Locked:</span> {preflightSummary.message}
                {preflightSummary.lock?.resetsAtISO ? (
                  <span className="ml-2 text-xs text-yellow-300/80">Resets: {preflightSummary.lock.resetsAtISO}</span>
                ) : null}
              </div>
              <LockCtaButton lock={preflightSummary.lock} />
            </div>
          ) : preflightSummary.kind === 'error' ? (
            <div className="mt-2 text-sm text-red-200">{preflightSummary.message}</div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-neutral-200">
              <div>
                Est. cost: <span className="font-semibold">{preflightSummary.estimatedTokens}</span> tokens
              </div>
              {preflightSummary.remainingTokens !== undefined ? (
                <div className="text-neutral-300">
                  Balance: <span className="font-semibold">{preflightSummary.remainingTokens}</span>
                </div>
              ) : null}
              {preflightSummary.runsUsed !== undefined && preflightSummary.planRunCap !== undefined ? (
                <div className="text-neutral-300">
                  Runs today: <span className="font-semibold">{preflightSummary.runsUsed}</span> / {preflightSummary.planRunCap}
                </div>
              ) : null}
              {preflightSummary.aiTokensUsed !== undefined && preflightSummary.planTokenCap !== undefined ? (
                <div className="text-neutral-300">
                  Tokens today: <span className="font-semibold">{preflightSummary.aiTokensUsed}</span> /{' '}
                  {preflightSummary.planTokenCap}
                </div>
              ) : null}
              {preflightSummary.toolRunsUsed !== undefined && preflightSummary.toolCap !== undefined ? (
                <div className="text-neutral-300">
                  Tool cap: <span className="font-semibold">{preflightSummary.toolRunsUsed}</span> / {preflightSummary.toolCap}
                </div>
              ) : null}
              {preflightSummary.meteringMode ? (
                <div className="text-neutral-500">metering: {preflightSummary.meteringMode}</div>
              ) : null}
            </div>
          )}
        </div>

        {/* Fields */}
        <div className="mt-4 grid grid-cols-1 gap-3">
          {tool.fields.map((f) => (
            <ToolField
              key={f.key}
              field={f}
              value={values[f.key]}
              error={fieldErrors[f.key]}
              onChange={(v) => setField(f.key, v)}
            />
          ))}
        </div>

        {/* Run */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={() => void runTool()}
            disabled={running || (preflightSummary?.kind === 'locked')}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60"
            title={preflightSummary?.kind === 'locked' ? 'Locked (see preflight)' : 'Run tool'}
          >
            {running ? 'Running…' : preflightSummary?.kind === 'locked' ? 'Locked' : 'Run tool'}
          </button>

          {preflightSummary?.kind === 'locked' ? (
            <div className="text-xs text-neutral-400">Fix lock reason above first (or click the CTA).</div>
          ) : (
            <div className="text-xs text-neutral-500">Inputs auto-save. Preflight runs automatically.</div>
          )}
        </div>
      </div>

      {/* Result */}
      {result ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold text-neutral-200">Result</div>
            {resultRequestId ? <div className="text-xs text-neutral-500">req: {resultRequestId}</div> : null}
          </div>

          {result.status === 'locked' && result.lock ? (
            <div className="mt-2 rounded-lg border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
              <div className="font-semibold">Locked: {result.lock.code}</div>
              <div className="mt-1">{result.lock.message}</div>
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-yellow-300/80">
                  {result.lock.usage
                    ? `Runs: ${result.lock.usage.runsUsed}/${result.lock.usage.runsCap} • Tokens: ${result.lock.usage.aiTokensUsed}/${result.lock.usage.aiTokensCap}`
                    : null}
                  {result.lock.resetsAtISO ? <div className="mt-1">Resets: {result.lock.resetsAtISO}</div> : null}
                </div>
                <LockCtaButton lock={result.lock} />
              </div>
            </div>
          ) : null}

          {result.status === 'error' && result.error ? (
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              {result.error.message}
              {result.error.details ? `\n\n${JSON.stringify(result.error.details, null, 2)}` : ''}
            </pre>
          ) : null}

          {result.status === 'ok' ? (
            <>
              {result.metering ? (
                <div className="mt-2 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-200">
                  <div>Charged: {result.metering.chargedTokens} tokens</div>
                  <div>Remaining: {result.metering.remainingTokens}</div>
                  <div>
                    Runs: {result.metering.runsUsed}/{result.metering.runsCap} • Tokens: {result.metering.aiTokensUsed}/
                    {result.metering.aiTokensCap}
                  </div>
                  <div>Mode: {result.metering.meteringMode}</div>
                </div>
              ) : null}

              <pre className="mt-3 overflow-auto rounded-lg bg-neutral-900 p-3 text-xs text-neutral-200">
                {JSON.stringify(result.output, null, 2)}
              </pre>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

