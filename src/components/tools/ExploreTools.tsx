'use client'

import * as React from 'react'
import { deriveCategoryFromTags } from '@/src/lib/tools/registry'
import type { ToolMeta, PlanId } from '@/src/lib/tools/registry'
import type { LockReason } from '@/src/lib/locks/lockTypes'
import { computeToolLock, getLockResetAt, getWorstLock } from '@/src/lib/locks/lockCompute'
import { formatLocalTime, getLockCopy } from '@/src/lib/locks/lockCopy'

type Props = { tools: ToolMeta[] }

type PreflightLockCode =
  | 'locked_tokens'
  | 'locked_usage_daily'
  | 'locked_tool_daily'
  | 'locked_plan'
  | 'locked_role'

type ToolPreflightResult = {
  toolId: string
  status: 'ok' | 'locked'
  lockCode?: PreflightLockCode
  message?: string
  requiredTokens?: number
  remainingTokens?: number
  tokensPerRun?: number
  usage?: {
    runsUsed: number
    runsCap: number
    aiTokensUsed: number
    aiTokensCap: number
    toolRunsUsed?: number
    toolRunsCap?: number
    resetsAtISO?: string
  }
}

type UiConfigSummary = {
  user: { planId: PlanId }
  usage: {
    tokensRemaining: number
    resetsAtISO: string
    dailyRunsUsed: number
    dailyRunCap: number
    perToolRunsUsed?: Record<string, number>
  }
}

const PREFLIGHT_TTL_KEY = 'tools_preflight_ttl_ts'
const PREFLIGHT_TTL_MS = 75_000
const canUseSessionStorage = () =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

function badgeForPreflight(p?: ToolPreflightResult) {
  if (!p) return { label: 'Checking...', tone: 'neutral' as const }
  if (p.status === 'ok') return { label: 'Available', tone: 'good' as const }

  switch (p.lockCode) {
    case 'locked_plan':
      return { label: 'Locked (Plan)', tone: 'warn' as const }
    case 'locked_tokens':
      return { label: 'Locked (Tokens)', tone: 'warn' as const }
    case 'locked_tool_daily':
      return { label: 'Cap reached', tone: 'warn' as const }
    case 'locked_usage_daily':
      return { label: 'Daily cap hit', tone: 'warn' as const }
    case 'locked_role':
      return { label: 'Viewer seat', tone: 'warn' as const }
    default:
      return { label: 'Locked', tone: 'warn' as const }
  }
}

export default function ExploreTools({ tools }: Props) {
  const [preflightMap, setPreflightMap] = React.useState<Record<string, ToolPreflightResult>>({})
  const [preflightError, setPreflightError] = React.useState<string | null>(null)
  const [uiConfig, setUiConfig] = React.useState<UiConfigSummary | null>(null)

  const toolsWithCategory = React.useMemo(() => {
    return tools.map((t) => ({
      ...t,
      __category: t.category || deriveCategoryFromTags(t.tags ?? []),
    }))
  }, [tools])

  const runPreflight = React.useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!tools.length) return

      if (!force && canUseSessionStorage()) {
        const last = Number(window.sessionStorage.getItem(PREFLIGHT_TTL_KEY) ?? 0)
        if (last && Date.now() - last < PREFLIGHT_TTL_MS) return
      }

      setPreflightError(null)

      try {
        const res = await fetch('/api/tools/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolIds: tools.map((t) => t.id) }),
        })

        if (!res.ok) {
          const errText = await res.text()
          throw new Error(errText || 'Preflight failed.')
        }

        const json = await res.json()
        const results: ToolPreflightResult[] = json?.results ?? []

        const map: Record<string, ToolPreflightResult> = {}
        for (const r of results) map[r.toolId] = r

        setPreflightMap(map)

        if (canUseSessionStorage()) {
          window.sessionStorage.setItem(PREFLIGHT_TTL_KEY, String(Date.now()))
        }
      } catch (err) {
        setPreflightMap({})
        setPreflightError(err instanceof Error ? err.message : 'Preflight failed.')
      } finally {
        // no-op
      }
    },
    [tools]
  )

  React.useEffect(() => {
    void runPreflight()
  }, [runPreflight])

  React.useEffect(() => {
    let active = true
    async function loadUiConfig() {
      try {
        const res = await fetch('/api/me/ui-config', { cache: 'no-store' })
        if (!res.ok) return
        const json = (await res.json()) as UiConfigSummary
        if (!active) return
        setUiConfig(json)
      } catch {
        setUiConfig(null)
      }
    }
    loadUiConfig()
    return () => {
      active = false
    }
  }, [])

  React.useEffect(() => {
    function handleFocus() {
      void runPreflight()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [runPreflight])

  const worstLock = React.useMemo(() => {
    if (!uiConfig) return null
    const planId = uiConfig.user.planId
    const usage = uiConfig.usage
    const locks = toolsWithCategory.map((tool) =>
      computeToolLock({
        toolMeta: tool,
        userPlanId: planId,
        usage: {
          tokensRemaining: usage.tokensRemaining ?? 0,
          resetAt: usage.resetsAtISO,
          runsUsed: usage.dailyRunsUsed,
          runsCap: usage.dailyRunCap,
          perToolRunsUsed: usage.perToolRunsUsed,
          toolRunsCap: tool.dailyRunsByPlan?.[planId] ?? 0,
        },
      })
    )
    return getWorstLock(locks)
  }, [uiConfig, toolsWithCategory])

  const filtered = React.useMemo(() => {
    const allowed = new Set([
      'hook-analyzer',
      'cta-match-analyzer',
      'content-angle-generator',
      'caption-optimizer',
      'engagement-diagnostic',
    ])

    return toolsWithCategory
      .filter((t) => allowed.has(t.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [toolsWithCategory])

  return (
    <div className="space-y-6">
      {preflightError ? (
        <div className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          Could not check availability. {preflightError}
        </div>
      ) : null}

      {worstLock && worstLock.type !== 'none' ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
          {(() => {
            const resetAt = getLockResetAt(worstLock)
            const hasToken =
              worstLock.type === 'tokens' ||
              (worstLock.type === 'multi' && worstLock.reasons.some((r) => r.type === 'tokens'))
            if (hasToken) {
              return (
                <>
                  <div>
                    You&apos;re locked by tokens {'->'} Buy tokens
                    {resetAt ? (
                      <div className="text-xs text-neutral-400">
                        Resets at {formatLocalTime(resetAt)} {'->'} Come back then
                      </div>
                    ) : null}
                  </div>
                  <a
                    href="/pricing?tab=tokens"
                    className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-100 hover:bg-neutral-800"
                  >
                    Get more tokens
                  </a>
                </>
              )
            }

            if (worstLock.type === 'plan' || worstLock.type === 'multi') {
              return (
                <>
                  <div>
                    <div>Some tools are locked by plan level</div>
                    <div className="text-xs text-neutral-400">Unlock full access to run everything</div>
                  </div>
                  <a
                    href="/pricing"
                    className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-neutral-100 hover:bg-neutral-800"
                  >
                    Unlock full access
                  </a>
                </>
              )
            }

            return (
              <div>
                Resets at{' '}
                <span className="font-semibold">{resetAt ? formatLocalTime(resetAt) : 'soon'}</span> {'->'} Come back then
              </div>
            )
          })()}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-300">
          No tools available.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <ToolCard key={t.id} tool={t} category={t.__category} preflight={preflightMap[t.id]} />
          ))}
        </div>
      )}
    </div>
  )
}

function ToolCard({
  tool,
  category,
  preflight,
}: {
  tool: ToolMeta
  category: string
  preflight?: ToolPreflightResult
}) {
  const [showWhy, setShowWhy] = React.useState(false)
  const href = `/app/tools/${tool.id}`

  const badge = badgeForPreflight(preflight)
  const badgeClass =
    badge.tone === 'good'
      ? 'bg-primary/10 border-primary/40 text-primary'
      : badge.tone === 'warn'
        ? 'bg-yellow-950/30 border-yellow-900 text-yellow-200'
        : 'bg-neutral-900 border-neutral-800 text-neutral-200'

  const sub =
    preflight?.status === 'locked' && preflight.lockCode === 'locked_tokens'
      ? `${preflight.remainingTokens ?? 0}/${preflight.requiredTokens ?? tool.tokensPerRun} tokens`
      : preflight?.status === 'locked' && preflight.usage?.resetsAtISO
        ? `Resets: ${new Date(preflight.usage.resetsAtISO).toLocaleString()}`
        : preflight?.status === 'ok'
          ? `${preflight.remainingTokens ?? '—'} tokens left`
          : ''

  const lockReason: LockReason | null =
    preflight?.status === 'locked'
      ? preflight.lockCode === 'locked_tokens'
        ? {
            type: 'tokens',
            tokensRemaining: preflight.remainingTokens ?? 0,
            resetAt: preflight.usage?.resetsAtISO || '',
          }
        : preflight.lockCode === 'locked_plan'
          ? { type: 'plan', requiredPlanId: 'pro_monthly' }
          : preflight.lockCode === 'locked_usage_daily' || preflight.lockCode === 'locked_tool_daily'
            ? { type: 'cooldown', availableAt: preflight.usage?.resetsAtISO || '' }
            : { type: 'plan', requiredPlanId: 'pro_monthly' }
      : null

  const lockCopy = lockReason ? getLockCopy(lockReason, getLockResetAt(lockReason)) : null

  return (
    <a
      href={href}
      className="group rounded-2xl border border-neutral-800 bg-neutral-950 p-4 transition hover:border-neutral-700 hover:bg-neutral-900/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span className="rounded-full border border-neutral-800 px-2 py-0.5">{category}</span>
            <span className="rounded-full border border-neutral-800 px-2 py-0.5">{tool.difficulty}</span>
            {preflight?.status === 'locked' ? (
              <span className="rounded-full border border-yellow-900 bg-yellow-950/30 px-2 py-0.5 text-yellow-200">
                Locked
              </span>
            ) : null}
          </div>
          <div className="text-base font-semibold text-neutral-100 group-hover:text-white">{tool.name}</div>
          <div className="line-clamp-2 text-sm text-neutral-400">{tool.description}</div>
        </div>
        <span className={`rounded-md border px-2 py-1 text-xs ${badgeClass}`}>{badge.label}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span className="rounded-md border border-neutral-800 px-2 py-1">{tool.tokensPerRun} tokens</span>
        {sub ? <span className="rounded-md border border-neutral-800 px-2 py-1">{sub}</span> : null}
      </div>

      {tool.tags?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {tool.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-[11px] text-neutral-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-red-300 group-hover:text-red-200">Open tool {'->'}</div>
        {preflight?.status === 'locked' && lockCopy ? (
          <button
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              setShowWhy((prev) => !prev)
            }}
            className="text-xs text-neutral-400 underline"
          >
            Why?
          </button>
        ) : null}
      </div>

      {showWhy && lockCopy ? (
        <div
          className="mt-3 rounded-lg border border-neutral-800 bg-neutral-900/40 p-3 text-xs text-neutral-300"
          onClick={(event) => event.preventDefault()}
        >
          <div className="font-semibold text-neutral-100">{lockCopy.headline}</div>
          <div className="text-neutral-400">{lockCopy.desc}</div>
          {lockCopy.secondary ? <div className="text-neutral-500">{lockCopy.secondary}</div> : null}
        </div>
      ) : null}
    </a>
  )
}
