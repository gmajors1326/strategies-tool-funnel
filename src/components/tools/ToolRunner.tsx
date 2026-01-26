'use client'

import * as React from 'react'
import Link from 'next/link'
import { ChevronDown, RefreshCw, Sparkles } from 'lucide-react'
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
  options?: Array<string | { label: string; value: string }>
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
  error?: string | { message?: string; code?: string; cta?: { label: string; href: string }; details?: any }
  requestId?: string
  degraded?: boolean
  degradedReason?: string
  disabledFeatures?: Array<'tokens' | 'history' | 'vault' | 'exports'>
  message?: string
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

const EMPTY_PLACEHOLDER = 'Needs more input.'

function sanitizeText(text: string) {
  return text.replace(/_/g, ' ').trim()
}

function formatLabel(label: string) {
  const withSpaces = label
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!withSpaces) return label
  return withSpaces[0].toUpperCase() + withSpaces.slice(1)
}

function summarizeText(value: unknown, limit = 120) {
  try {
    if (typeof value === 'string') return sanitizeText(value.slice(0, limit))
    const json = JSON.stringify(value)
    const sanitized = sanitizeText(json)
    return sanitized.length > limit ? `${sanitized.slice(0, limit)}…` : sanitized
  } catch {
    return ''
  }
}

function isPrimitive(value: any) {
  return value === null || value === undefined || ['string', 'number', 'boolean'].includes(typeof value)
}

function renderPrimitiveValue(value: any, limit = 120) {
  if (value === null || value === undefined) return EMPTY_PLACEHOLDER
  if (typeof value === 'string') {
    const trimmed = sanitizeText(value).trim()
    if (!trimmed) return EMPTY_PLACEHOLDER
    return trimmed.length > limit ? `${trimmed.slice(0, limit)}...` : trimmed
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  try {
    const json = JSON.stringify(value)
    const sanitized = sanitizeText(json)
    return sanitized.length > limit ? `${sanitized.slice(0, limit)}...` : sanitized
  } catch {
    return EMPTY_PLACEHOLDER
  }
}

function ExpandableText({ text, limit = 220 }: { text: string; limit?: number }) {
  const [expanded, setExpanded] = React.useState(false)
  if (text.length <= limit) return <span>{text}</span>
  return (
    <span>
      {expanded ? text : `${text.slice(0, limit)}…`}{' '}
      <button type="button" className="text-xs underline" onClick={() => setExpanded((prev) => !prev)}>
        {expanded ? 'Show less' : 'Show more'}
      </button>
    </span>
  )
}

function ValueRenderer({
  value,
  depth = 0,
  cardFields,
}: {
  value: any
  depth?: number
  cardFields?: string[]
}) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }
  if (typeof value === 'string') {
    return <ExpandableText text={sanitizeText(value)} />
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return <span>{String(value)}</span>
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">{EMPTY_PLACEHOLDER}</span>
    const allPrimitive = value.every((item) => isPrimitive(item))
    if (allPrimitive) {
      return (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed">
          {value.slice(0, 6).map((item, idx) => (
            <li key={`${idx}-${String(item)}`}>{renderPrimitiveValue(item)}</li>
          ))}
          {value.length > 6 ? (
            <li className="text-xs text-muted-foreground">Show more ({value.length - 6})</li>
          ) : null}
        </ul>
      )
    }

    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {value.slice(0, 6).map((item, idx) => {
          const obj = typeof item === 'object' && item ? item : { value: item }
          const fields =
            cardFields && cardFields.length
              ? cardFields
              : Object.keys(obj).filter((key) => isPrimitive(obj[key])).slice(0, 4)
          return (
            <div key={`${idx}-${fields.join('-')}`} className="rounded-md border bg-muted/20 p-3 text-sm">
              {fields.map((key) => (
                <div key={key} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">{formatLabel(key)}</span>
                  <span className="font-medium leading-relaxed">{renderPrimitiveValue(obj[key], 140)}</span>
                </div>
              ))}
            </div>
          )
        })}
        {value.length > 6 ? (
          <div className="text-xs text-muted-foreground">Show more ({value.length - 6})</div>
        ) : null}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, any>)
    if (entries.length === 0) return <span className="text-muted-foreground">{EMPTY_PLACEHOLDER}</span>
    if (depth >= 2) {
      const sanitizedJson = sanitizeText(JSON.stringify(value, null, 2))
      return (
        <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">
          {sanitizedJson}
        </pre>
      )
    }
    return (
      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {entries.map(([key, val]) => (
          <div key={key} className="rounded-md border bg-muted/10 p-3">
            <div className="text-xs text-muted-foreground">{formatLabel(key)}</div>
            <div className="mt-1 text-sm leading-relaxed">
              <ValueRenderer value={val} depth={depth + 1} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return <span>{renderPrimitiveValue(value)}</span>
}

function SectionBlock({
  title,
  value,
  onCopy,
  cardFields,
  defaultOpen = false,
}: {
  title: string
  value: any
  onCopy: (text: string, label: string) => void
  cardFields?: string[]
  defaultOpen?: boolean
}) {
  const [showJson, setShowJson] = React.useState(false)
  return (
    <details className="group rounded-md border bg-muted/10 p-2" open={defaultOpen}>
      <summary className="cursor-pointer list-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden="true" />
            <h3 className="text-sm font-semibold">{formatLabel(title)}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                onCopy(sanitizeText(JSON.stringify(value, null, 2)), `Copied ${formatLabel(title)}`)
              }}
            >
              Copy
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault()
                setShowJson((prev) => !prev)
              }}
            >
              {showJson ? 'Hide JSON' : 'View JSON'}
            </Button>
          </div>
        </div>
      </summary>
      <div className="mt-2">
          {showJson ? (
            <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-2 text-xs">
              {sanitizeText(JSON.stringify(value ?? {}, null, 2))}
            </pre>
          ) : (
            <ValueRenderer value={value} cardFields={cardFields} />
          )}
      </div>
    </details>
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
  const [historyBusy, setHistoryBusy] = React.useState(false)
  const [historySource, setHistorySource] = React.useState<'server' | 'local'>('local')
  const [historyLastSyncAt, setHistoryLastSyncAt] = React.useState<string | null>(null)
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
  const [authLoaded, setAuthLoaded] = React.useState(false)
  const [authStatus, setAuthStatus] = React.useState<{ signedIn: boolean; email?: string | null }>({
    signedIn: false,
    email: null,
  })
  const [showGate, setShowGate] = React.useState(false)
  const isDev = process.env.NODE_ENV !== 'production'

  function debugLog(message: string, meta?: Record<string, any>) {
    if (!isDev) return
    // eslint-disable-next-line no-console
    console.info(`[tool-runner] ${message}`, meta ?? {})
  }

  const canExport = Boolean(ui?.entitlements?.canExport)
  const canSeeHistory = Boolean(ui?.entitlements?.canSeeHistory)
  const canSaveToVault = Boolean(ui?.entitlements?.canSaveToVault)
  const canExportTemplates = Boolean(ui?.entitlements?.canExportTemplates)
  const degraded = Boolean(result?.degraded)
  const canExportEffective = canExport && !degraded
  const canSeeHistoryEffective = canSeeHistory
  const canSaveToVaultEffective = canSaveToVault && !degraded
  const canExportTemplatesEffective = canExportTemplates && !degraded
  const planLocked = !canExportEffective || !canSaveToVaultEffective || !canExportTemplatesEffective
  const nextToolId = getRecommendedNextToolId(toolId)
  const header = isLaunchTool(toolId) ? getLaunchHeader(toolId) : null
  const headerStatus = busy ? { label: 'Running', spinning: true } : undefined

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
    if (!canSeeHistoryEffective) {
      setHistorySource('local')
      setHistory(readLocalRuns(toolSlug))
      return
    }

    setHistoryBusy(true)
    try {
      const res = await fetch(`/api/tools/runs/recent?toolId=${encodeURIComponent(toolId)}`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.runs ?? [])
        setHistorySource('server')
        setHistoryLastSyncAt(new Date().toISOString())
        return
      }
    } catch {
      // ignore
    } finally {
      setHistoryBusy(false)
    }

    setHistorySource('local')
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
  }, [toolSlug, canSeeHistoryEffective])

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

  const refreshAuth = React.useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setAuthStatus({
        signedIn: Boolean(data?.signedIn),
        email: data?.email ?? null,
      })
      setAuthLoaded(true)
    } catch {
      setAuthLoaded(true)
    }
  }, [])

  React.useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  React.useEffect(() => {
    if (Object.keys(input).length > 0) return
    const last = readLastInput(toolId)
    if (last && Object.keys(last).length > 0) {
      setInput(last)
      setPrefillNote('Loaded your last inputs.')
    }
  }, [toolId, input])

  async function runToolInternal() {
    setBusy(true)
    setResult(null)
    setMsg(null)
    setFieldErrors({})
    setSoftWarning(null)

    if (!validateInputs()) {
      setMsg('Please fill the required fields to run this tool.')
      setBusy(false)
      return
    }
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
      debugLog('request_start', { toolId, payloadKeys: Object.keys(input || {}) })
      const res = await fetch('/api/tools/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, mode: 'paid', input }),
      })

      const data = (await res.json().catch(() => null)) as RunResponse | null
      const requestId = res.headers.get('x-request-id') || data?.requestId
      debugLog('request_end', {
        toolId,
        status: res.status,
        ok: res.ok,
        errorCode: typeof data?.error === 'string' ? undefined : data?.error?.code,
        lockCode: data?.lock?.code,
        requestId,
      })
      if (!data) {
        setResult({
          status: 'error',
          error: { message: 'Run failed. Invalid response from server.' },
        })
        if (requestId) setMsg(`Request ID: ${requestId}`)
        return
      }

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
        if (errorCode === 'VALIDATION_ERROR' && typeof errorValue !== 'string') {
          const details = (errorValue as any)?.details
          if (details && typeof details === 'object') {
            setFieldErrors(details as Record<string, string>)
          }
        }
        setResult({
          status: 'error',
          error: {
            message,
            code: errorCode,
            cta: errorState.cta,
            details: typeof errorValue === 'string' ? undefined : errorValue?.details,
          },
          requestId,
        })
        if (res.status === 401) {
          router.push('/verify?next=/')
        }
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

  async function runTool() {
    if (!authLoaded) {
      await refreshAuth()
    }
    if (!authStatus.signedIn) {
      setShowGate(true)
      return
    }
    return runToolInternal()
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

  type ResultConfig = {
    order: string[]
    titles?: Record<string, string>
    cardFields?: Record<string, string[]>
  }

  const RESULT_CONFIG: Record<string, ResultConfig> = {
    'hook-analyzer': {
      order: ['summary', 'score', 'diagnosis', 'rewrites', 'nextSteps'],
      titles: { score: 'Scores', rewrites: 'Rewrites', nextSteps: 'Next steps' },
      cardFields: { rewrites: ['hook', 'rationale'] },
    },
    'cta-match-analyzer': {
      order: ['summary', 'score', 'diagnosis', 'rewrites', 'nextSteps'],
      titles: { score: 'Scores', rewrites: 'Rewrites', nextSteps: 'Next steps' },
      cardFields: { rewrites: ['cta', 'rationale'] },
    },
    'content-angle-generator': {
      order: ['summary', 'angles', 'notes', 'nextSteps'],
      titles: { angles: 'Angles', nextSteps: 'Next steps' },
      cardFields: { angles: ['angle', 'hook', 'format', 'rationale'] },
    },
    'caption-optimizer': {
      order: ['summary', 'revisions', 'notes', 'nextSteps'],
      titles: { revisions: 'Revisions', nextSteps: 'Next steps' },
      cardFields: { revisions: ['caption', 'rationale'] },
    },
    'engagement-diagnostic': {
      order: ['summary', 'signals', 'prioritizedFixes', 'nextSteps'],
      titles: { prioritizedFixes: 'Prioritized fixes', nextSteps: 'Next steps' },
      cardFields: {
        signals: ['signal', 'evidence', 'severity'],
        prioritizedFixes: ['title', 'why', 'how', 'impact', 'effort'],
      },
    },
  }

  function buildSummaryLines(output: any) {
    const lines: Array<{ label: string; value: any }> = []
    const summary = output?.summary
    if (typeof summary === 'string') {
      lines.push({ label: 'Summary', value: summary })
      return lines
    }
    if (summary && typeof summary === 'object') {
      const primary = summary?.primaryIssue || summary?.oneSentenceDiagnosis
      if (primary) lines.push({ label: 'Primary issue', value: primary })
      if (summary?.confidence !== undefined) lines.push({ label: 'Confidence', value: summary.confidence })
      if (!lines.length) {
        Object.entries(summary)
          .filter(([, v]) => isPrimitive(v))
          .slice(0, 3)
          .forEach(([k, v]) => lines.push({ label: k, value: v }))
      }
      return lines
    }
    if (output?.score && typeof output.score === 'object') {
      Object.entries(output.score)
        .filter(([, v]) => typeof v === 'number')
        .slice(0, 3)
        .forEach(([k, v]) => lines.push({ label: k, value: v }))
    }
    if (!lines.length && Array.isArray(output?.angles) && output.angles[0]) {
      lines.push({ label: 'Top angle', value: output.angles[0].angle || output.angles[0].hook })
    }
    if (!lines.length && Array.isArray(output?.rewrites) && output.rewrites[0]) {
      lines.push({ label: 'Top rewrite', value: output.rewrites[0].cta || output.rewrites[0].hook })
    }
    if (!lines.length && Array.isArray(output?.signals) && output.signals[0]) {
      lines.push({ label: 'Top signal', value: output.signals[0].signal })
    }
    if (!lines.length) {
      Object.entries(output || {})
        .filter(([, v]) => isPrimitive(v))
        .slice(0, 3)
        .forEach(([k, v]) => lines.push({ label: k, value: v }))
    }
    return lines
  }

  function getSummaryPayload(output: any) {
    if (!output) return ''
    if (typeof output !== 'object') return output
    if (typeof output?.summary === 'string') return output.summary
    if (output?.summary && typeof output.summary === 'object') return output.summary
    const lines = buildSummaryLines(output)
    return lines.length ? lines : output
  }

  function sanitizeForCopy(value: any): any {
    if (value === null || value === undefined) return EMPTY_PLACEHOLDER
    if (typeof value === 'string') return sanitizeText(value)
    if (typeof value === 'number' || typeof value === 'boolean') return value
    if (Array.isArray(value)) return value.map((item) => sanitizeForCopy(item))
    if (typeof value === 'object') {
      const output: Record<string, any> = {}
      Object.entries(value).forEach(([key, val]) => {
        output[formatLabel(key)] = sanitizeForCopy(val)
      })
      return output
    }
    return value
  }

  function renderGenericResult(output: any) {
    if (!output || typeof output !== 'object') {
      return <ValueRenderer value={output} />
    }

    const config = RESULT_CONFIG[toolId]
    const allEntries = Object.entries(output)
    const order = config?.order ?? []
    const ordered = order.filter((key) => key in output).map((key) => [key, output[key]] as [string, any])
    const remaining = allEntries.filter(([key]) => !order.includes(key))
    const sections = [...ordered, ...remaining]
    const summaryLines = buildSummaryLines(output)

    return (
      <div className="space-y-4">
        <div className="rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Summary</h3>
          </div>
          <div className="mt-2 space-y-3 text-sm text-muted-foreground">
            {summaryLines.length ? (
              summaryLines.map((line) => (
                <div key={line.label} className="flex flex-col gap-2">
                  <span className="text-foreground text-sm font-medium">{formatLabel(String(line.label))}</span>
                  <ValueRenderer value={line.value} />
                </div>
              ))
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        </div>

        {sections.map(([key, value], idx) => (
          <SectionBlock
            key={key}
            title={config?.titles?.[key] ?? key}
            value={value}
            onCopy={copy}
            cardFields={config?.cardFields?.[key]}
            defaultOpen={idx < 2}
          />
        ))}
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
            </div>
            <div className="mt-2 rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">
              <div className="text-xs text-muted-foreground">Primary issue</div>
              <div className="font-medium text-sm">{renderPrimitiveValue(summary?.primaryIssue)}</div>
              <div className="mt-3 text-xs text-muted-foreground">Diagnosis</div>
              <div className="text-sm leading-relaxed">{renderPrimitiveValue(summary?.oneSentenceDiagnosis)}</div>
              <div className="mt-3 text-xs text-muted-foreground">
                Confidence: <span className="text-foreground">{renderPrimitiveValue(summary?.confidence)}</span>
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
                  copy(JSON.stringify(sanitizeForCopy(signals), null, 2), 'Copied signals')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
          <ul className="mt-2 space-y-2 text-sm">
            {signals.map((item: any, idx: number) => (
              <li key={`signal-${idx}`} className="rounded-md border bg-muted/20 p-2">
                <div className="text-xs text-muted-foreground">{renderPrimitiveValue(item?.severity)}</div>
                <div className="font-medium">{renderPrimitiveValue(item?.signal)}</div>
                <div className="text-xs text-muted-foreground">{renderPrimitiveValue(item?.evidence)}</div>
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
                  copy(JSON.stringify(sanitizeForCopy(fixes), null, 2), 'Copied fixes')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            {fixes.map((item: any, idx: number) => (
              <div key={`fix-${idx}`} className="rounded-md border bg-muted/20 p-3">
                <div className="font-medium">{renderPrimitiveValue(item?.title)}</div>
                <div className="text-xs text-muted-foreground">{renderPrimitiveValue(item?.why)}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Impact: <span className="text-foreground">{renderPrimitiveValue(item?.impact)}</span> · Effort:{' '}
                  <span className="text-foreground">{renderPrimitiveValue(item?.effort)}</span>
                </div>
                <ul className="mt-2 list-disc pl-5 text-xs">
                  {(item?.how || []).map((step: string, stepIdx: number) => (
                    <li key={`fix-${idx}-step-${stepIdx}`}>{renderPrimitiveValue(step)}</li>
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
                  copy(JSON.stringify(sanitizeForCopy(plan), null, 2), 'Copied plan')
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
                <div className="font-medium">{renderPrimitiveValue(item?.reelIdea)}</div>
                <div className="text-muted-foreground">Hook: {renderPrimitiveValue(item?.hook)}</div>
                <ul className="mt-1 list-disc pl-4">
                  {(item?.shotPlan || []).map((step: string, stepIdx: number) => (
                    <li key={`day-${idx}-shot-${stepIdx}`}>{renderPrimitiveValue(step)}</li>
                  ))}
                </ul>
                <div className="mt-1 text-muted-foreground">CTA: {renderPrimitiveValue(item?.cta)}</div>
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
                  copy(JSON.stringify(sanitizeForCopy(output?.stopDoing ?? []), null, 2), 'Copied stop doing')
                }}
              >
                Copy
              </Button>
            </div>
          </summary>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {(output?.stopDoing || []).map((item: string, idx: number) => (
              <li key={`stop-${idx}`}>{renderPrimitiveValue(item)}</li>
            ))}
          </ul>
        </details>

        <details className="rounded-md border bg-muted/10 p-2" open={!lowConfidence}>
          <summary className="cursor-pointer list-none">
            <h3 className="text-sm font-semibold">Experiment</h3>
          </summary>
          <div className="mt-2 rounded-md border bg-muted/20 p-3 text-sm">
            <div className="font-medium">{renderPrimitiveValue(output?.experiment?.name)}</div>
            <div className="text-xs text-muted-foreground">{renderPrimitiveValue(output?.experiment?.hypothesis)}</div>
            <ul className="mt-2 list-disc pl-5 text-xs">
              {(output?.experiment?.steps || []).map((step: string, idx: number) => (
                <li key={`exp-${idx}`}>{renderPrimitiveValue(step)}</li>
              ))}
            </ul>
            <div className="mt-2 text-xs text-muted-foreground">
              Success metric:{' '}
              <span className="text-foreground">{renderPrimitiveValue(output?.experiment?.successMetric)}</span>
            </div>
          </div>
        </details>
      </div>
    )
  }

  function renderOutput() {
    if (!result?.output) return null
    const summaryPayload = sanitizeForCopy(getSummaryPayload(result.output))
    const summaryText =
      typeof summaryPayload === 'string' ? summaryPayload : JSON.stringify(summaryPayload, null, 2)
    const outputPayload = sanitizeForCopy(result.output)
    const outputText =
      typeof outputPayload === 'string' ? outputPayload : JSON.stringify(outputPayload, null, 2)

    let content: React.ReactNode = null
    if (typeof result.output === 'string') {
      content = (
        <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
          {sanitizeText(result.output)}
        </pre>
      )
    } else if (toolId === 'analytics-signal-reader') {
      content = renderAnalyticsSignalReader(result.output)
    } else {
      content = renderGenericResult(result.output)
    }

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => copy(summaryText, 'Copied summary')}>
            Copy Summary
          </Button>
          <Button variant="secondary" size="sm" onClick={() => copy(outputText, 'Copied all')}>
            Copy All
          </Button>
        </div>
        {content}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {header ? <ToolPageHeader title={header.title} description={header.description} status={headerStatus} /> : null}
      <div className="rounded-2xl border border-[#d2c1a8] bg-[#eadcc7] p-4 text-sm text-[#2f3b2b] shadow-[0_12px_24px_rgba(48,40,28,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#1f3b2b]">7-day trial</p>
            <p className="text-base font-semibold">Try every tool free for 7 days.</p>
            <p className="text-xs text-[#1f3b2b]">After the trial, choose Pro ($39) or Elite ($99) to keep access.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <Link className="text-[#7ee6a3] hover:text-[#1f3b2b]" href="/verify?next=/">
                Start Trial
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/pricing">View plans</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <ToolRunToolbar
          toolId={toolId}
          toolSlug={toolSlug}
          runId={latestRunId}
          canExport={canExportEffective}
          canSaveToVault={canSaveToVaultEffective}
          canExportTemplates={canExportTemplatesEffective}
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
                  <span className="inline-flex items-center gap-2">
                    <Sparkles className="h-4 w-4" aria-hidden="true" />
                    Load example
                  </span>
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
                      {(f.options ?? []).map((opt) => {
                        const value = typeof opt === 'string' ? opt : opt.value
                        const label = typeof opt === 'string' ? opt : opt.label
                        return (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        )
                      })}
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

          {showGate ? (
            <div className="space-y-3 rounded-md border bg-muted/20 p-3 text-sm">
              <div className="font-semibold">Sign in to run this tool</div>
              <p className="text-xs text-muted-foreground">Choose one of the options below to continue.</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button variant="outline" onClick={() => router.push('/verify?next=/')}>
                  Sign in
                </Button>
                <Button variant="secondary" onClick={() => router.push('/signup')}>
                  Create Account
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2 pt-2">
            <Button className="w-full" onClick={runTool} disabled={busy || isLocked}>
              {isLocked
                ? access === 'locked_tokens'
                  ? 'Locked - Buy tokens'
                  : access === 'locked_time'
                    ? 'Locked - Wait for reset'
                    : 'Locked - Upgrade'
                : busy
                  ? (
                      <span className="inline-flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Running...
                      </span>
                    )
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
              {(() => {
                if (typeof result.error === 'string') return null
                if (result.error?.code !== 'VALIDATION_ERROR') return null
                const details =
                  result.error?.details && typeof result.error.details === 'object'
                    ? (result.error.details as Record<string, string>)
                    : fieldErrors
                if (!details || Object.keys(details).length === 0) return null
                return (
                  <div className="mt-2 space-y-1 text-xs text-[hsl(var(--muted))]">
                    {Object.entries(details).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-[hsl(var(--text))]">{key}</span>: {value}
                      </div>
                    ))}
                  </div>
                )
              })()}
              {result?.requestId ? (
                <div className="mt-1 text-xs text-[hsl(var(--muted))]">Request ID: {result.requestId}</div>
              ) : null}
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
              <p className="text-sm font-medium">Recent runs {canSeeHistoryEffective ? '' : '(free: last 3)'}</p>

              <div className="flex items-center gap-2">
                {canSeeHistoryEffective ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => loadHistory()}
                    disabled={historyBusy}
                  >
                    {historyBusy ? 'Retrying...' : 'Retry server history'}
                  </Button>
                ) : null}
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
            </div>

            <div className="mt-1 text-xs text-muted-foreground">
              {canSeeHistoryEffective
                ? historySource === 'server'
                  ? 'Server history synced.'
                  : 'Server history unavailable.'
                : 'Server history is locked on this plan.'}{' '}
              Last sync:{' '}
              {historyLastSyncAt ? new Date(historyLastSyncAt).toLocaleString() : 'Never'}
            </div>

            {canSeeHistoryEffective && history?.length ? (
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
              <p className="mt-2 text-sm text-muted-foreground">
                {degraded
                  ? 'History is temporarily unavailable from the server. Local history appears after you run a tool.'
                  : 'No runs yet.'}
              </p>
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
              ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Running...
                  </span>
                )
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
