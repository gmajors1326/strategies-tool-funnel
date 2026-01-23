'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { ToolMeta, PlanId } from '@/src/lib/tools/registry'
import type { LockReason } from '@/src/lib/locks/lockTypes'
import { computeToolLock } from '@/src/lib/locks/lockCompute'
import { LockBanner } from '@/src/components/locks/LockBanner'

type ToolField = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'url'
  placeholder?: string
  help?: string
  required?: boolean
  options?: string[]
}

type UiConfig = {
  entitlements?: {
    canExport?: boolean
    canSeeHistory?: boolean
    canSaveToVault?: boolean
    canExportTemplates?: boolean
  }
}

type RunResponse = {
  status?: 'ok' | 'locked' | 'error'
  output?: any
  lock?: { code?: string; message?: string; resetsAtISO?: string; remainingTokens?: number }
  error?: string | { message?: string }
}

function safeJsonParse(s: string) {
  try {
    return JSON.parse(s)
  } catch {
    return null
  }
}

function lsKey(toolSlug: string) {
  return `tool_runs:${toolSlug}`
}

function pushLocalRun(toolSlug: string, input: any, output: any) {
  const key = lsKey(toolSlug)
  const existing = safeJsonParse(localStorage.getItem(key) || '[]') || []
  const next = [
    { id: crypto.randomUUID(), at: new Date().toISOString(), input, output },
    ...existing,
  ].slice(0, 10)
  localStorage.setItem(key, JSON.stringify(next))
  return next
}

function readLocalRuns(toolSlug: string) {
  const key = lsKey(toolSlug)
  return safeJsonParse(localStorage.getItem(key) || '[]') || []
}

export function ToolRunner(props: {
  toolId: string
  toolSlug: string
  toolName: string
  toolMeta: ToolMeta
  fields: ToolField[]
  access?: 'unlocked' | 'locked_tokens' | 'locked_time' | 'locked_plan'
  tokensCost?: number
  ui?: UiConfig | null
}) {
  const { toolId, toolSlug, toolName, toolMeta, fields, access, tokensCost, ui } = props

  const [input, setInput] = React.useState<Record<string, any>>({})
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<RunResponse | null>(null)
  const [history, setHistory] = React.useState<any[]>([])
  const [copied, setCopied] = React.useState<string | null>(null)
  const [msg, setMsg] = React.useState<string | null>(null)
  const [lockReason, setLockReason] = React.useState<LockReason>({ type: 'none' })
  const [tokensRemaining, setTokensRemaining] = React.useState<number | null>(null)
  const [tokensAllowance, setTokensAllowance] = React.useState<number | null>(null)
  const [tokensResetAt, setTokensResetAt] = React.useState<string | null>(null)

  const canExport = Boolean(ui?.entitlements?.canExport)
  const canSeeHistory = Boolean(ui?.entitlements?.canSeeHistory)
  const canSaveToVault = Boolean(ui?.entitlements?.canSaveToVault)
  const canExportTemplates = Boolean(ui?.entitlements?.canExportTemplates)

  const isLocked =
    access === 'locked_tokens' || access === 'locked_time' || access === 'locked_plan' || lockReason.type !== 'none'

  function mapRunLockToReason(lock: RunResponse['lock']): LockReason | null {
    if (!lock?.code) return null
    if (lock.code === 'locked_tokens') {
      return {
        type: 'tokens',
        tokensRemaining: lock.remainingTokens ?? 0,
        resetAt: lock.resetsAtISO || '',
      }
    }
    if (lock.code === 'locked_plan' || lock.code === 'locked_role') {
      return { type: 'plan', requiredPlanId: 'pro_monthly' }
    }
    if (lock.code === 'locked_usage_daily' || lock.code === 'locked_tool_daily') {
      return { type: 'cooldown', availableAt: lock.resetsAtISO || '' }
    }
    return null
  }

  React.useEffect(() => {
    let active = true
    async function loadLock() {
      try {
        const res = await fetch('/api/me/ui-config', { cache: 'no-store' })
        if (!res.ok) return
        const uiConfig = await res.json()
        if (!active) return
        setTokensRemaining(Number(uiConfig?.usage?.tokensRemaining ?? 0))
        setTokensAllowance(Number(uiConfig?.usage?.aiTokenCap ?? 0))
        setTokensResetAt(uiConfig?.usage?.resetsAtISO ?? null)
        const planId = uiConfig?.user?.planId as PlanId
        const usage = uiConfig?.usage || {}
        const lock = computeToolLock({
          toolMeta,
          userPlanId: planId,
          usage: {
            tokensRemaining: Number(usage.tokensRemaining ?? 0),
            resetAt: usage.resetsAtISO,
            runsUsed: Number(usage.dailyRunsUsed ?? 0),
            runsCap: Number(usage.dailyRunCap ?? 0),
            perToolRunsUsed: usage.perToolRunsUsed ?? {},
            toolRunsCap: toolMeta.dailyRunsByPlan?.[planId] ?? 0,
          },
        })
        setLockReason(lock)
      } catch {
        // ignore
      }
    }
    loadLock()
    return () => {
      active = false
    }
  }, [toolMeta])

  const lowTokenThreshold = React.useMemo(() => {
    if (!tokensAllowance) return 0
    return Math.max(200, Math.floor(tokensAllowance * 0.1))
  }, [tokensAllowance])

  const showLowTokens =
    tokensRemaining !== null &&
    tokensAllowance !== null &&
    tokensAllowance > 0 &&
    tokensRemaining <= lowTokenThreshold

  const hasLoggedLowTokens = React.useRef(false)
  React.useEffect(() => {
    if (!showLowTokens || hasLoggedLowTokens.current) return
    hasLoggedLowTokens.current = true
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'token_low_banner_shown',
        meta: { toolId, remaining: tokensRemaining, allowance: tokensAllowance },
      }),
    })
  }, [showLowTokens, toolId, tokensRemaining, tokensAllowance])

  async function loadHistory() {
    if (canSeeHistory) {
      const res = await fetch(`/api/tool-runs?toolSlug=${encodeURIComponent(toolSlug)}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.runs ?? [])
        return
      }
    }
    setHistory(readLocalRuns(toolSlug))
  }

  React.useEffect(() => {
    loadHistory().catch(() => setHistory(readLocalRuns(toolSlug)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSlug, canSeeHistory])

  async function runTool() {
    setBusy(true)
    setResult(null)
    setMsg(null)

    if (lockReason.type !== 'none') {
      setMsg('This tool is temporarily unavailable. Review the lock details above.')
      setBusy(false)
      return
    }

    try {
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, mode: 'paid', input }),
      })

      const data = (await res.json()) as RunResponse

      if (!res.ok || data?.status === 'locked' || data?.status === 'error') {
        const mapped = mapRunLockToReason(data.lock)
        if (mapped) setLockReason(mapped)
        const errorValue = data?.error
        const message =
          data?.lock?.message ||
          (typeof errorValue === 'string' ? errorValue : errorValue?.message) ||
          'Run failed.'
        setResult({ error: message })
        return
      }

      setResult(data)
      pushLocalRun(toolSlug, input, data.output)

      await loadHistory()
    } catch (e: any) {
      setResult({ error: e?.message || 'Network error.' })
    } finally {
      setBusy(false)
    }
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 900)
    } catch {
      setCopied('Copy failed')
      setTimeout(() => setCopied(null), 900)
    }
  }

  function download(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  async function saveToVault() {
    if (!result?.output) return
    setMsg(null)

    const res = await fetch('/api/vault/save-run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toolSlug,
        title: `${toolName} - saved run`,
        input,
        output: result.output,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setMsg(data?.error || 'Save failed.')
      return
    }

    setMsg('Saved to Vault.')
    setTimeout(() => setMsg(null), 1200)
  }

  async function exportTemplate(kind: 'template' | 'checklist') {
    if (!result?.output) return
    setMsg(null)

    const res = await fetch('/api/export/template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolSlug, kind, output: result.output }),
    })

    const data = await res.json()
    if (!res.ok) {
      setMsg(data?.error || 'Export failed.')
      return
    }

    const filename = `${toolSlug}-${kind}.json`
    download(filename, JSON.stringify(data.payload, null, 2))
    setMsg(`Exported ${kind}.`)
    setTimeout(() => setMsg(null), 1200)
  }

  function renderJsonFallback(output: any) {
    return (
      <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
        {JSON.stringify(output ?? {}, null, 2)}
      </pre>
    )
  }

  function renderHookAnalyzer(output: any) {
    const scores = output?.score || {}
    const diagnosis = output?.diagnosis || {}
    const rewrites = Array.isArray(output?.rewrites) ? output.rewrites : []
    const beats = output?.['6secReelPlan']?.beats || []

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Scores</h3>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {['hook', 'clarity', 'curiosity', 'specificity'].map((key) => (
              <div key={key} className="rounded-md border bg-muted/20 p-2">
                <div className="text-muted-foreground">{key}</div>
                <div className="text-sm font-semibold">{scores?.[key] ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Hook Type + Best For</h3>
          <div className="mt-2 text-sm">
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium">{output?.hookType ?? '—'}</div>
            <div className="mt-2 text-muted-foreground">Best for</div>
            <div className="flex flex-wrap gap-2">
              {(output?.bestFor || []).map((item: string) => (
                <span key={item} className="rounded-md border bg-muted/20 px-2 py-1 text-xs">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Diagnosis</h3>
          <div className="mt-2 space-y-2 text-sm">
            <div>
              <div className="text-muted-foreground">What works</div>
              <ul className="list-disc pl-5">
                {(diagnosis?.whatWorks || []).map((item: string, idx: number) => (
                  <li key={`works-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-muted-foreground">What hurts</div>
              <ul className="list-disc pl-5">
                {(diagnosis?.whatHurts || []).map((item: string, idx: number) => (
                  <li key={`hurts-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="text-muted-foreground">
              Retention risk: <span className="text-foreground">{diagnosis?.retentionRisk ?? '—'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Rewrites</h3>
          <div className="mt-2 space-y-2 text-sm">
            {rewrites.map((item: any, idx: number) => (
              <div key={`rewrite-${idx}`} className="rounded-md border bg-muted/20 p-2">
                <div className="text-xs text-muted-foreground">{item?.style ?? 'style'}</div>
                <div className="text-sm">{item?.hook ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">6-sec Reel Plan</h3>
          <div className="mt-2 space-y-2 text-sm">
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="text-xs text-muted-foreground">Opening frame</div>
              <div>{output?.['6secReelPlan']?.openingFrameText ?? '—'}</div>
            </div>
            <div className="space-y-2">
              {beats.map((beat: any, idx: number) => (
                <div key={`beat-${idx}`} className="rounded-md border bg-muted/20 p-2 text-xs">
                  <div className="text-muted-foreground">{beat?.t ?? 'time'}</div>
                  <div>On-screen: {beat?.onScreen ?? '—'}</div>
                  <div>Voice: {beat?.voice ?? '—'}</div>
                </div>
              ))}
            </div>
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="text-xs text-muted-foreground">Loop ending</div>
              <div>{output?.['6secReelPlan']?.loopEnding ?? '—'}</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">CTA + Avoid</h3>
          <div className="mt-2 space-y-2 text-sm">
            <div className="rounded-md border bg-muted/20 p-2">
              <div className="text-xs text-muted-foreground">CTA</div>
              <div className="font-medium">{output?.cta?.recommended ?? '—'}</div>
              <div>{output?.cta?.line ?? '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Avoid</div>
              <ul className="list-disc pl-5">
                {(output?.avoid || []).map((item: string, idx: number) => (
                  <li key={`avoid-${idx}`}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderAnalyticsSignalReader(output: any) {
    const summary = output?.summary || {}
    const signals = Array.isArray(output?.signals) ? output.signals : []
    const fixes = Array.isArray(output?.prioritizedFixes) ? output.prioritizedFixes.slice(0, 5) : []
    const plan = Array.isArray(output?.next7Days) ? output.next7Days : []

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold">Summary</h3>
          <div className="mt-2 rounded-md border bg-muted/20 p-3 text-sm">
            <div className="text-xs text-muted-foreground">Primary issue</div>
            <div className="font-medium">{summary?.primaryIssue ?? '—'}</div>
            <div className="mt-2 text-xs text-muted-foreground">Diagnosis</div>
            <div>{summary?.oneSentenceDiagnosis ?? '—'}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Confidence: <span className="text-foreground">{summary?.confidence ?? '—'}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Signals</h3>
          <ul className="mt-2 space-y-2 text-sm">
            {signals.map((item: any, idx: number) => (
              <li key={`signal-${idx}`} className="rounded-md border bg-muted/20 p-2">
                <div className="text-xs text-muted-foreground">{item?.severity ?? '—'}</div>
                <div className="font-medium">{item?.signal ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{item?.evidence ?? '—'}</div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Prioritized Fixes</h3>
          <div className="mt-2 space-y-2 text-sm">
            {fixes.map((item: any, idx: number) => (
              <div key={`fix-${idx}`} className="rounded-md border bg-muted/20 p-3">
                <div className="font-medium">{item?.title ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{item?.why ?? '—'}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Impact: <span className="text-foreground">{item?.impact ?? '—'}</span> · Effort:{' '}
                  <span className="text-foreground">{item?.effort ?? '—'}</span>
                </div>
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {(item?.how || []).map((step: string, stepIdx: number) => (
                    <li key={`fix-${idx}-step-${stepIdx}`}>{step}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Next 7 Days</h3>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {plan.map((item: any, idx: number) => (
              <div key={`day-${idx}`} className="rounded-md border bg-muted/20 p-3 text-xs">
                <div className="text-muted-foreground">Day {item?.day ?? idx + 1}</div>
                <div className="font-medium">{item?.reelIdea ?? '—'}</div>
                <div className="text-muted-foreground">Hook: {item?.hook ?? '—'}</div>
                <ul className="mt-1 list-disc pl-4">
                  {(item?.shotPlan || []).map((step: string, stepIdx: number) => (
                    <li key={`day-${idx}-shot-${stepIdx}`}>{step}</li>
                  ))}
                </ul>
                <div className="mt-1 text-muted-foreground">CTA: {item?.cta ?? '—'}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Stop Doing</h3>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {(output?.stopDoing || []).map((item: string, idx: number) => (
              <li key={`stop-${idx}`}>{item}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold">Experiment</h3>
          <div className="mt-2 rounded-md border bg-muted/20 p-3 text-sm">
            <div className="font-medium">{output?.experiment?.name ?? '—'}</div>
            <div className="text-xs text-muted-foreground">{output?.experiment?.hypothesis ?? '—'}</div>
            <ul className="mt-2 list-disc pl-5 text-xs">
              {(output?.experiment?.steps || []).map((step: string, idx: number) => (
                <li key={`exp-${idx}`}>{step}</li>
              ))}
            </ul>
            <div className="mt-2 text-xs text-muted-foreground">
              Success metric: <span className="text-foreground">{output?.experiment?.successMetric ?? '—'}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderOutput() {
    if (!result?.output) return null
    if (typeof result.output === 'string') {
      return (
        <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
          {result.output}
        </pre>
      )
    }
    if (toolId === 'hook-analyzer') {
      return renderHookAnalyzer(result.output)
    }
    if (toolId === 'analytics-signal-reader') {
      return renderAnalyticsSignalReader(result.output)
    }
    return renderJsonFallback(result.output)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Run {toolName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {lockReason.type !== 'none' ? (
            <LockBanner
              lock={lockReason}
              context="tool"
              showChips={lockReason.type === 'multi'}
              showUpgradeCta={Boolean(toolMeta.planEntitlements?.pro_monthly)}
            />
          ) : null}
          {showLowTokens ? (
            <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 text-sm">
              <div className="font-semibold">Running low on tokens</div>
              <p className="text-xs text-[hsl(var(--muted))]">
                Buy a pack to keep going, or wait for the daily reset at{' '}
                {tokensResetAt ? new Date(tokensResetAt).toLocaleString() : 'soon'}.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href="/pricing?tab=tokens&reason=tokens">
                  <Button className="h-8 px-3 text-xs">Buy tokens</Button>
                </Link>
                <Link href="/account/usage">
                  <Button variant="outline" className="h-8 px-3 text-xs">
                    See usage
                  </Button>
                </Link>
              </div>
            </div>
          ) : null}
          {fields.length ? (
            fields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">{f.label}</label>
                  {f.required ? <span className="text-xs text-muted-foreground">required</span> : null}
                </div>

                {f.type === 'textarea' ? (
                  <Textarea
                    placeholder={f.placeholder}
                    value={input[f.key] ?? ''}
                    onChange={(e) => setInput((p) => ({ ...p, [f.key]: e.target.value }))}
                  />
                ) : f.type === 'select' ? (
                  <Select
                    value={input[f.key] ?? ''}
                    onChange={(e) => setInput((p) => ({ ...p, [f.key]: e.target.value }))}
                  >
                    <option value="">{f.placeholder ?? 'Select'}</option>
                    {(f.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    placeholder={f.placeholder}
                    value={input[f.key] ?? ''}
                    onChange={(e) =>
                      setInput((p) => ({
                        ...p,
                        [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                      }))
                    }
                  />
                )}

                {f.help ? <p className="text-xs text-muted-foreground">{f.help}</p> : null}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">This tool does not expose input fields yet.</p>
          )}

          <div className="space-y-2 pt-2">
            <Button className="w-full" onClick={runTool} disabled={busy || isLocked}>
              {isLocked
                ? access === 'locked_tokens'
                  ? 'Locked - Buy tokens'
                  : access === 'locked_time'
                    ? 'Locked - Wait for reset'
                    : 'Locked - Upgrade'
                : busy
                  ? 'Running...'
                  : tokensCost && tokensCost > 0
                    ? `Run (${tokensCost} tokens)`
                    : 'Run'}
            </Button>

            {isLocked ? (
              <p className="text-xs text-muted-foreground">
                This tool is locked right now. Use the banner or pricing flow to unlock it.
              </p>
            ) : null}

            {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
            {copied ? <p className="text-xs text-muted-foreground">{copied}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Result</CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output}
              onClick={() => copy(JSON.stringify(result?.output ?? {}, null, 2), 'Copied JSON')}
            >
              Copy JSON
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canExport}
              onClick={() =>
                download(
                  `${toolSlug}-output.txt`,
                  typeof result?.output === 'string'
                    ? result.output
                    : JSON.stringify(result?.output ?? {}, null, 2)
                )
              }
              title={canExport ? 'Download output' : 'Available on Pro'}
            >
              Export
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canSaveToVault}
              onClick={saveToVault}
              title={canSaveToVault ? 'Save this run' : 'Available on Pro'}
            >
              Save to Vault
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canExportTemplates}
              onClick={() => exportTemplate('template')}
              title={canExportTemplates ? 'Export template' : 'Available on Pro'}
            >
              Template
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canExportTemplates}
              onClick={() => exportTemplate('checklist')}
              title={canExportTemplates ? 'Export checklist' : 'Available on Pro'}
            >
              Checklist
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!canExport || !canSaveToVault || !canExportTemplates ? (
            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 text-xs text-[hsl(var(--muted))]">
              Pro unlocks exports and saved templates.
            </div>
          ) : null}
          {!canExport ? (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Export is locked (paid perk). Copy JSON is still available.
            </div>
          ) : null}

          {result?.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
              {typeof result.error === 'string' ? result.error : result.error?.message}
            </div>
          ) : result?.output ? (
            renderOutput()
          ) : (
            <div className="rounded-md border bg-muted/20 p-3 text-sm text-muted-foreground">
              Run the tool to see output here.
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Recent runs {canSeeHistory ? '' : '(local)'}</p>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  localStorage.removeItem(lsKey(toolSlug))
                  setHistory([])
                }}
              >
                Clear local
              </Button>
            </div>

            {history?.length ? (
              <div className="mt-2 space-y-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    className="w-full rounded-md border p-3 text-left transition hover:bg-muted/20"
                    onClick={() => {
                      setInput(h.input ?? {})
                      setResult({ output: h.output })
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">{new Date(h.at).toLocaleString()}</span>
                      <span className="text-xs text-muted-foreground">Load</span>
                    </div>
                    <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {JSON.stringify(h.output ?? {}).slice(0, 140)}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No runs yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ToolRunner
