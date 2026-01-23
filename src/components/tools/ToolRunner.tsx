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
import { ToolRunToolbar } from '@/src/components/tools/ToolRunToolbar'
import { HelpTooltip } from '@/components/tools/HelpTooltip'
import { TOOL_REGISTRY } from '@/src/lib/tools/registry'
import { getLaunchHeader, getRecommendedNextToolId, isLaunchTool } from '@/src/lib/tools/launchTools'
import { ToolPageHeader } from '@/src/components/tools/ToolPageHeader'
import { useRouter } from 'next/navigation'

type ToolField = {
  key: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'url'
  placeholder?: string
  help?: string
  required?: boolean
  options?: string[]
  min?: number
  max?: number
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
  runId?: string | null
  output?: any
  lock?: { code?: string; message?: string; resetsAtISO?: string; remainingTokens?: number }
  error?: string | { message?: string; code?: string; cta?: { label: string; href: string } }
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
    {
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      input,
      output,
      inputSummary: summarizeText(input),
      status: 'success',
    },
    ...existing,
  ].slice(0, 10)
  localStorage.setItem(key, JSON.stringify(next))
  return next
}

function readLocalRuns(toolSlug: string) {
  const key = lsKey(toolSlug)
  return safeJsonParse(localStorage.getItem(key) || '[]') || []
}

const TOOL_MEMORY_KEY = 'tool_memory_v1'
const TOOL_PRESETS_KEY = 'tool_presets_v1'
const TOOL_LAST_INPUT_KEY = 'tool_last_input_v1'

type ToolMemory = {
  input: Record<string, any>
  output: any
  outputSummary: string
  createdAt: string
}

type ToolPreset = {
  id: string
  name: string
  input: Record<string, any>
  createdAt: string
}

function readToolMemory(): Record<string, ToolMemory> {
  if (typeof window === 'undefined') return {}
  return safeJsonParse(localStorage.getItem(TOOL_MEMORY_KEY) || '{}') || {}
}

function writeToolMemory(toolId: string, payload: ToolMemory) {
  if (typeof window === 'undefined') return
  const existing = readToolMemory()
  const next = { ...existing, [toolId]: payload }
  localStorage.setItem(TOOL_MEMORY_KEY, JSON.stringify(next))
}

function readToolPresets(toolId: string): ToolPreset[] {
  if (typeof window === 'undefined') return []
  const all = safeJsonParse(localStorage.getItem(TOOL_PRESETS_KEY) || '{}') || {}
  return Array.isArray(all[toolId]) ? all[toolId] : []
}

function writeToolPresets(toolId: string, presets: ToolPreset[]) {
  if (typeof window === 'undefined') return
  const all = safeJsonParse(localStorage.getItem(TOOL_PRESETS_KEY) || '{}') || {}
  const next = { ...all, [toolId]: presets }
  localStorage.setItem(TOOL_PRESETS_KEY, JSON.stringify(next))
}

function readLastInput(toolId: string): Record<string, any> | null {
  if (typeof window === 'undefined') return null
  const all = safeJsonParse(localStorage.getItem(TOOL_LAST_INPUT_KEY) || '{}') || {}
  return all[toolId] ?? null
}

function writeLastInput(toolId: string, input: Record<string, any>) {
  if (typeof window === 'undefined') return
  const all = safeJsonParse(localStorage.getItem(TOOL_LAST_INPUT_KEY) || '{}') || {}
  const next = { ...all, [toolId]: input }
  localStorage.setItem(TOOL_LAST_INPUT_KEY, JSON.stringify(next))
}

function isEmptyValue(value: any) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

function getConfidenceScore(output: any): number | null {
  const summary = output?.summary
  const value = typeof summary?.confidence === 'number' ? summary.confidence : typeof output?.confidence === 'number' ? output.confidence : null
  if (value === null || Number.isNaN(value)) return null
  return Math.max(0, Math.min(1, value))
}

function mapGoalToDesiredAction(goal?: string) {
  switch (goal) {
    case 'follows':
      return 'follow'
    case 'saves':
      return 'save'
    case 'comments':
      return 'comment'
    case 'dm_clicks':
      return 'dm'
    default:
      return undefined
  }
}

function mapDesiredToCtaGoal(action?: string) {
  switch (action) {
    case 'follow':
      return 'follow'
    case 'save':
      return 'save'
    case 'comment':
      return 'comment'
    case 'dm':
      return 'dm'
    case 'click_link':
      return 'click_link'
    default:
      return undefined
  }
}

function summarizeText(value: unknown, limit = 120) {
  try {
    if (typeof value === 'string') return value.slice(0, limit)
    const json = JSON.stringify(value)
    return json.length > limit ? `${json.slice(0, limit)}…` : json
  } catch {
    return ''
  }
}

function SectionBlock({
  title,
  value,
  onCopy,
}: {
  title: string
  value: any
  onCopy: (text: string, label: string) => void
}) {
  const [expanded, setExpanded] = React.useState(false)
  const isArray = Array.isArray(value)
  const items = isArray ? value : []
  const visible = isArray ? (expanded ? items : items.slice(0, 3)) : []

  return (
    <div className="rounded-md border bg-muted/20 p-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <Button variant="ghost" size="sm" onClick={() => onCopy(JSON.stringify(value, null, 2), `Copied ${title}`)}>
          Copy
        </Button>
      </div>
      {isArray ? (
        <div className="mt-2 space-y-2">
          {visible.map((item: any, idx: number) => (
            <div key={`${title}-${idx}`} className="rounded-md border bg-muted/30 p-2 text-xs">
              {typeof item === 'string' ? item : JSON.stringify(item, null, 2)}
            </div>
          ))}
          {items.length > 3 ? (
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? 'Show less' : `Show more (${items.length - 3})`}
            </button>
          ) : null}
        </div>
      ) : (
        <pre className="mt-2 max-h-[240px] overflow-auto rounded-md border bg-muted/30 p-2 text-xs">
          {JSON.stringify(value ?? {}, null, 2)}
        </pre>
      )}
    </div>
  )
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

  const router = useRouter()
  const [input, setInput] = React.useState<Record<string, any>>({})
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<RunResponse | null>(null)
  const [history, setHistory] = React.useState<any[]>([])
  const [copied, setCopied] = React.useState<string | null>(null)
  const [msg, setMsg] = React.useState<string | null>(null)
  const [lockReason, setLockReason] = React.useState<LockReason>({ type: 'none' })
  const [latestRunId, setLatestRunId] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [prefillNote, setPrefillNote] = React.useState<string | null>(null)
  const [softWarning, setSoftWarning] = React.useState<string | null>(null)
  const [presets, setPresets] = React.useState<ToolPreset[]>([])
  const [selectedPreset, setSelectedPreset] = React.useState<string>('')
  const [tokensRemaining, setTokensRemaining] = React.useState<number | null>(null)
  const [tokensAllowance, setTokensAllowance] = React.useState<number | null>(null)
  const [tokensResetAt, setTokensResetAt] = React.useState<string | null>(null)

  const canExport = Boolean(ui?.entitlements?.canExport)
  const canSeeHistory = Boolean(ui?.entitlements?.canSeeHistory)
  const canSaveToVault = Boolean(ui?.entitlements?.canSaveToVault)
  const canExportTemplates = Boolean(ui?.entitlements?.canExportTemplates)
  const planLocked = !canExport || !canSaveToVault || !canExportTemplates
  const nextToolId = getRecommendedNextToolId(toolId)
  const header = isLaunchTool(toolId) ? getLaunchHeader(toolId) : null

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

  function mapErrorState(data: RunResponse, status: number) {
    if (status === 401) {
      return { message: 'Sign in to run tools.', cta: { label: 'Sign in', href: '/verify' } }
    }
    if (status === 403 && data?.lock?.code === 'locked_plan') {
      return { message: 'Available on Pro.', cta: { label: 'View plans', href: '/pricing?reason=plan&tab=plans' } }
    }
    if (data?.lock?.code === 'locked_tokens') {
      return {
        message: 'You’re out of tokens for today.',
        cta: { label: 'Buy tokens', href: '/pricing?tab=tokens&reason=tokens' },
      }
    }
    if (data?.lock?.code === 'locked_usage_daily' || data?.lock?.code === 'locked_tool_daily') {
      return {
        message: 'This tool is on cooldown.',
        cta: { label: 'See usage', href: '/account/usage' },
      }
    }
    return { message: 'Run failed. Try again in a moment.' }
  }

  function getExampleInput() {
    return toolMeta.examples?.[0]?.input ?? null
  }

  function getFieldExample(key: string) {
    const example = getExampleInput()
    if (!example) return null
    const value = example[key]
    if (value === undefined || value === null || value === '') return null
    if (Array.isArray(value)) return value.join(', ')
    if (typeof value === 'object') return JSON.stringify(value)
    return String(value)
  }


  function validateInputs() {
    const errors: Record<string, string> = {}
    for (const field of fields) {
      const value = input[field.key]
      if (field.required) {
        const empty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0)
        if (empty) {
          errors[field.key] = `${field.label} is required.`
          continue
        }
      }
      if (field.type === 'number' && value !== undefined && value !== null && value !== '') {
        const num = Number(value)
        if (Number.isNaN(num)) {
          errors[field.key] = `${field.label} must be a number.`
          continue
        }
        if (typeof field.min === 'number' && num < field.min) {
          errors[field.key] = `${field.label} must be at least ${field.min}.`
        }
        if (typeof field.max === 'number' && num > field.max) {
          errors[field.key] = `${field.label} must be at most ${field.max}.`
        }
      }
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  function missingCriticalFields() {
    return fields
      .filter((field) => field.required && isEmptyValue(input[field.key]))
      .map((field) => field.label)
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
    const res = await fetch(`/api/tools/runs/recent?toolId=${encodeURIComponent(toolId)}`, {
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      setHistory(data.runs ?? [])
      return
    }
    setHistory(readLocalRuns(toolSlug))
  }

  async function loadRun(runId: string, fallback?: { input?: any; output?: any }) {
    try {
      const res = await fetch(`/api/tools/runs/get?runId=${encodeURIComponent(runId)}`, { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setInput(data.input ?? {})
        setResult({ output: data.output })
        setLatestRunId(data.runId ?? runId)
        return
      }
    } catch {
      // ignore
    }
    if (fallback?.input || fallback?.output) {
      setInput(fallback.input ?? {})
      setResult({ output: fallback.output })
      setLatestRunId(runId)
    }
  }

  React.useEffect(() => {
    loadHistory().catch(() => setHistory(readLocalRuns(toolSlug)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolSlug, canSeeHistory])

  React.useEffect(() => {
    setPresets(readToolPresets(toolId))
  }, [toolId])

  React.useEffect(() => {
    if (Object.keys(input).length > 0) return
    const memory = readToolMemory()
    const sequence = ['hook-analyzer', 'cta-match-analyzer', 'caption-optimizer', 'engagement-diagnostic']
    const idx = sequence.indexOf(toolId)
    const prevToolId = idx > 0 ? sequence[idx - 1] : null
    if (!prevToolId) return
    const prev = memory[prevToolId]
    if (!prev) return

    const prevInput = prev.input ?? {}
    const nextInput: Record<string, any> = {}

    if (toolId === 'cta-match-analyzer') {
      if (isEmptyValue(input.contentSummary)) {
        const summary = prevInput.hookText || prevInput.topic
        if (summary) nextInput.contentSummary = summary
      }
      if (isEmptyValue(input.desiredAction)) {
        const mapped = mapGoalToDesiredAction(prevInput.goal)
        if (mapped) nextInput.desiredAction = mapped
      }
    }

    if (toolId === 'caption-optimizer') {
      if (isEmptyValue(input.hook)) {
        const hook = prevInput.hookText || prevInput.ctaText
        if (hook) nextInput.hook = hook
      }
      if (isEmptyValue(input.ctaGoal)) {
        const mapped = mapDesiredToCtaGoal(prevInput.desiredAction)
        if (mapped) nextInput.ctaGoal = mapped
      }
    }

    if (toolId === 'engagement-diagnostic') {
      if (isEmptyValue(input.contentLinkOrTranscript)) {
        const transcript = prevInput.rawCaption || prev.outputSummary || prevInput.hookText
        if (transcript) nextInput.contentLinkOrTranscript = transcript
      }
      if (isEmptyValue(input.goal)) {
        const mapped = mapDesiredToCtaGoal(prevInput.ctaGoal) || mapGoalToDesiredAction(prevInput.goal)
        if (mapped === 'follow') nextInput.goal = 'more_follows'
        if (mapped === 'save') nextInput.goal = 'more_saves'
        if (mapped === 'dm') nextInput.goal = 'more_dms'
        if (mapped === 'click_link') nextInput.goal = 'more_clicks'
        if (mapped === 'comment') nextInput.goal = 'more_comments'
      }
    }

    if (Object.keys(nextInput).length > 0) {
      setInput(nextInput)
      const prevName = (TOOL_REGISTRY as Record<string, ToolMeta>)[prevToolId]?.name || 'last run'
      setPrefillNote(`Pulled from your last ${prevName} run.`)
    }
  }, [toolId, input])

  React.useEffect(() => {
    if (Object.keys(input).length > 0) return
    const last = readLastInput(toolId)
    if (last && Object.keys(last).length > 0) {
      setInput(last)
      setPrefillNote('Loaded your last inputs.')
    }
  }, [toolId, input])

  async function runTool() {
    setBusy(true)
    setResult(null)
    setMsg(null)
    setFieldErrors({})
    setSoftWarning(null)

    validateInputs()
    const missing = missingCriticalFields()
    if (missing.length) {
      setSoftWarning(`Results may be weak without ${missing.join(', ')}.`)
    }

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
          mapErrorState(data, res.status).message
        const errorState = mapErrorState(data, res.status)
        const errorCode = data?.lock?.code || (typeof errorValue === 'string' ? undefined : errorValue?.code)
        setResult({
          status: 'error',
          error: { message, code: errorCode, cta: errorState.cta },
        })
        return
      }

      setResult(data)
      setLatestRunId(data.runId ?? null)
      pushLocalRun(toolSlug, input, data.output)
      writeToolMemory(toolId, {
        input,
        output: data.output,
        outputSummary: summarizeText(data.output),
        createdAt: new Date().toISOString(),
      })
      writeLastInput(toolId, input)

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

  function renderJsonFallback(output: any) {
    const confidence = getConfidenceScore(output)
    const lowConfidence = confidence !== null && confidence < 0.5
    if (!output || typeof output !== 'object') {
      return (
        <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
          {JSON.stringify(output ?? {}, null, 2)}
        </pre>
      )
    }

    const entries = Object.entries(output)
    const summaryPairs = entries.slice(0, 3)

    return (
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Summary</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(JSON.stringify(summaryPairs, null, 2), 'Copied summary')}
            >
              Copy
            </Button>
          </div>
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {summaryPairs.map(([key, value]) => (
              <div key={key}>
                <span className="text-foreground">{key}</span>: {String(value ?? '')}
              </div>
            ))}
          </div>
        </div>
        {entries.map(([key, value]) => (
          <details key={key} open={!lowConfidence} className="rounded-md border bg-muted/10 p-2">
            <summary className="cursor-pointer list-none">
              <div className="text-sm font-semibold">{key}</div>
            </summary>
            <SectionBlock title={key} value={value} onCopy={copy} />
          </details>
        ))}
      </div>
    )
  }

  function renderHookAnalyzer(output: any) {
    const scores = output?.score || {}
    const diagnosis = output?.diagnosis || {}
    const rewrites = Array.isArray(output?.rewrites) ? output.rewrites : []
    const beats = output?.['6secReelPlan']?.beats || []

    return (
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/20 p-3 text-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Summary</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copy(
                  JSON.stringify(
                    {
                      hookType: output?.hookType ?? '',
                      topScore: scores?.hook ?? null,
                      bestFor: (output?.bestFor || []).slice(0, 3),
                    },
                    null,
                    2
                  ),
                  'Copied summary'
                )
              }
            >
              Copy
            </Button>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Hook type: <span className="text-foreground">{output?.hookType ?? '—'}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Top score: <span className="text-foreground">{scores?.hook ?? '—'}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Best for: <span className="text-foreground">{(output?.bestFor || []).slice(0, 3).join(', ')}</span>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Scores</h3>
            <Button variant="ghost" size="sm" onClick={() => copy(JSON.stringify(scores, null, 2), 'Copied scores')}>
              Copy
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Diagnosis</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(JSON.stringify(diagnosis, null, 2), 'Copied diagnosis')}
            >
              Copy
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Rewrites</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(JSON.stringify(rewrites, null, 2), 'Copied rewrites')}
            >
              Copy
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">6-sec Reel Plan</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(JSON.stringify(output?.['6secReelPlan'] ?? {}, null, 2), 'Copied plan')}
            >
              Copy
            </Button>
          </div>
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">CTA + Avoid</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                copy(JSON.stringify({ cta: output?.cta ?? {}, avoid: output?.avoid ?? [] }, null, 2), 'Copied CTA')
              }
            >
              Copy
            </Button>
          </div>
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
    const confidence = getConfidenceScore(output)
    const lowConfidence = confidence !== null && confidence < 0.5

    return (
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Summary</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copy(JSON.stringify(summary, null, 2), 'Copied summary')}
            >
              Copy
            </Button>
          </div>
          <div className="mt-2 rounded-md border bg-muted/20 p-3 text-sm">
            <div className="text-xs text-muted-foreground">Primary issue</div>
            <div className="font-medium">{summary?.primaryIssue ?? '—'}</div>
            <div className="mt-2 text-xs text-muted-foreground">Diagnosis</div>
            <div>{summary?.oneSentenceDiagnosis ?? '—'}</div>
            <div className="mt-2 text-xs text-muted-foreground">
              Confidence: <span className="text-foreground">{summary?.confidence ?? '—'}</span>
            </div>
          </div>
          {lowConfidence ? (
            <div className="mt-2 text-xs text-muted-foreground">
              Improve accuracy: add more metrics or context to your input.
            </div>
          ) : null}
        </div>

        <details className="rounded-md border bg-muted/10 p-2" open={!lowConfidence}>
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Signals</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault()
                  copy(JSON.stringify(signals, null, 2), 'Copied signals')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
          <ul className="mt-2 space-y-2 text-sm">
            {signals.map((item: any, idx: number) => (
              <li key={`signal-${idx}`} className="rounded-md border bg-muted/20 p-2">
                <div className="text-xs text-muted-foreground">{item?.severity ?? '—'}</div>
                <div className="font-medium">{item?.signal ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{item?.evidence ?? '—'}</div>
              </li>
            ))}
          </ul>
        </details>

        <details className="rounded-md border bg-muted/10 p-2" open={!lowConfidence}>
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Prioritized Fixes</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault()
                  copy(JSON.stringify(fixes, null, 2), 'Copied fixes')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
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
        </details>

        <details className="rounded-md border bg-muted/10 p-2" open={!lowConfidence}>
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Next 7 Days</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault()
                  copy(JSON.stringify(plan, null, 2), 'Copied plan')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
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
        </details>

        <details className="rounded-md border bg-muted/10 p-2" open={!lowConfidence}>
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Stop Doing</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={(event) => {
                  event.preventDefault()
                  copy(JSON.stringify(output?.stopDoing ?? [], null, 2), 'Copied stop doing')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {(output?.stopDoing || []).map((item: string, idx: number) => (
              <li key={`stop-${idx}`}>{item}</li>
            ))}
          </ul>
        </details>

        <details className="rounded-md border bg-muted/10 p-2" open={!lowConfidence}>
          <summary className="cursor-pointer list-none">
            <h3 className="text-sm font-semibold">Experiment</h3>
          </summary>
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
        </details>
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
    <div className="space-y-4">
      {header ? <ToolPageHeader title={header.title} description={header.description} /> : null}
      <div className="flex flex-col gap-2">
        <ToolRunToolbar
          toolId={toolId}
          toolSlug={toolSlug}
          runId={latestRunId}
          canExport={canExport}
          canSaveToVault={canSaveToVault}
          canExportTemplates={canExportTemplates}
          onMessage={setMsg}
        />
        {planLocked ? (
          <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-2 text-xs text-[hsl(var(--muted))]">
            Actions like Save, Export, and PDF are available on Pro.{' '}
            <Link href="/pricing?reason=plan&tab=plans" className="text-[hsl(var(--text))] underline">
              View plans
            </Link>
            .
          </div>
        ) : null}
      </div>

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
          <div className="rounded-md border bg-muted/20 p-3 text-sm">
            <div className="mt-1 text-xs">
              <span className="text-muted-foreground">Best for: </span>
              <span className="text-foreground">
                {toolMeta.microcopy?.whoFor?.[0] || toolMeta.tags.slice(0, 2).join(', ') || 'Short-form creators'}
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">How to use</div>
            <ul className="mt-1 list-disc pl-4 text-xs">
              <li>Fill the inputs clearly.</li>
              <li>Run the tool and scan the summary.</li>
              <li>Apply the top recommendations.</li>
            </ul>
            {getExampleInput() ? (
              <div className="mt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setInput(getExampleInput() ?? {})
                    setFieldErrors({})
                    setMsg('Loaded example input.')
                    setTimeout(() => setMsg(null), 1200)
                  }}
                >
                  Load example
                </Button>
              </div>
            ) : null}
          </div>
          {prefillNote ? <div className="text-xs text-muted-foreground">{prefillNote}</div> : null}
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
            <>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">Presets</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!input || Object.keys(input).length === 0) {
                        setMsg('Add inputs before saving a preset.')
                        return
                      }
                      if (!canSaveToVault) {
                        router.push('/pricing?reason=plan&tab=plans&feature=save')
                        return
                      }
                      const nextName = `Preset ${presets.length + 1}`
                      const nextPreset: ToolPreset = {
                        id: crypto.randomUUID(),
                        name: nextName,
                        input,
                        createdAt: new Date().toISOString(),
                      }
                      const next = [nextPreset, ...presets].slice(0, 10)
                      setPresets(next)
                      writeToolPresets(toolId, next)
                      setSelectedPreset(nextPreset.id)
                      setMsg(`Saved ${nextName}.`)
                    }}
                    title={canSaveToVault ? 'Save preset' : 'Available on Pro'}
                  >
                    Save preset
                  </Button>
                </div>
                <Select
                  value={selectedPreset}
                  onChange={(e) => {
                    const value = e.target.value
                    setSelectedPreset(value)
                    if (value === 'example' && getExampleInput()) {
                      setInput(getExampleInput() ?? {})
                      setPrefillNote('Loaded example preset.')
                      return
                    }
                    if (value === 'last') {
                      const last = readLastInput(toolId)
                      if (last) {
                        setInput(last)
                        setPrefillNote('Loaded your last inputs.')
                      }
                      return
                    }
                    const preset = presets.find((p) => p.id === value)
                    if (preset) {
                      setInput(preset.input)
                      setPrefillNote(`Loaded ${preset.name}.`)
                    }
                  }}
                >
                  <option value="">Choose preset</option>
                  {readLastInput(toolId) ? <option value="last">Last used</option> : null}
                  {getExampleInput() ? <option value="example">Example</option> : null}
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name}
                    </option>
                  ))}
                </Select>
              </div>
              {fields.map((f) => (
                <div key={f.key} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">{f.label}</label>
                      {f.help ? <HelpTooltip content={f.help} /> : null}
                    </div>
                    {f.required ? <span className="text-xs text-muted-foreground">required</span> : null}
                  </div>

                  {f.type === 'textarea' ? (
                    <Textarea
                      placeholder={f.placeholder}
                      value={input[f.key] ?? ''}
                      onChange={(e) => {
                        setInput((p) => ({ ...p, [f.key]: e.target.value }))
                        if (fieldErrors[f.key]) {
                          setFieldErrors((prev) => ({ ...prev, [f.key]: '' }))
                        }
                      }}
                    />
                  ) : f.type === 'select' ? (
                    <Select
                      value={input[f.key] ?? ''}
                      onChange={(e) => {
                        setInput((p) => ({ ...p, [f.key]: e.target.value }))
                        if (fieldErrors[f.key]) {
                          setFieldErrors((prev) => ({ ...prev, [f.key]: '' }))
                        }
                      }}
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
                      onChange={(e) => {
                        setInput((p) => ({
                          ...p,
                          [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value,
                        }))
                        if (fieldErrors[f.key]) {
                          setFieldErrors((prev) => ({ ...prev, [f.key]: '' }))
                        }
                      }}
                    />
                  )}
                  {getFieldExample(f.key) ? (
                    <p className="text-xs text-muted-foreground">Example: {getFieldExample(f.key)}</p>
                  ) : null}
                  {fieldErrors[f.key] ? (
                    <p className="text-xs text-destructive">{fieldErrors[f.key]}</p>
                  ) : null}
                </div>
              ))}
            </>
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

            {softWarning ? <p className="text-xs text-muted-foreground">{softWarning}</p> : null}
            {msg ? <p className="text-xs text-muted-foreground">{msg}</p> : null}
            {copied ? <p className="text-xs text-muted-foreground">{copied}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Result</CardTitle>
          <Button
            variant="secondary"
            size="sm"
            disabled={!result?.output}
            onClick={() => copy(JSON.stringify(result?.output ?? {}, null, 2), 'Copied JSON')}
          >
            Copy JSON
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {(() => {
            const confidence = getConfidenceScore(result?.output)
            if (confidence === null) return null
            const label = confidence >= 0.75 ? 'High' : confidence >= 0.5 ? 'Medium' : 'Low'
            return (
              <div className="text-xs text-muted-foreground">
                Confidence: <span className="text-foreground">{label}</span>
                {confidence < 0.5 ? ' · Improve accuracy by adding more context.' : null}
              </div>
            )
          })()}
          {result?.error ? (
            <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-3 text-sm">
              <div className="font-medium">
                {typeof result.error === 'string' ? result.error : result.error?.message}
              </div>
              {'cta' in (result.error as any) && (result.error as any)?.cta?.href ? (
                <div className="mt-2">
                  <Link href={(result.error as any).cta.href}>
                    <Button size="sm">{(result.error as any).cta.label}</Button>
                  </Link>
                </div>
              ) : null}
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
              <p className="text-sm font-medium">Recent runs {canSeeHistory ? '' : '(free: last 3)'}</p>

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
                {history.map((h) => {
                  const runId = h.runId || h.id
                  const createdAt = h.createdAt || h.at
                  const summary = h.inputSummary || summarizeText(h.input)
                  return (
                    <div key={runId} className="w-full rounded-md border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium">
                            {createdAt ? new Date(createdAt).toLocaleString() : 'Recent run'}
                          </div>
                          <div className="text-xs text-muted-foreground">{summary || 'Run summary unavailable.'}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{h.status || 'success'}</div>
                      </div>
                      <div className="mt-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => loadRun(runId, { input: h.input, output: h.output })}
                        >
                          Load
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">No runs yet.</p>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--bg))] p-3 lg:hidden">
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
      </div>
      {nextToolId ? (
        <div className="text-xs text-muted-foreground">
          Next recommended tool:{' '}
          <span className="text-foreground">
            {(TOOL_REGISTRY as Record<string, ToolMeta>)[nextToolId]?.name || 'Next tool'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

export default ToolRunner
