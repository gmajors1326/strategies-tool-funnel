'use client'

import * as React from 'react'
import { deriveCategoryFromTags } from '@/src/lib/tools/registry'
import type { ToolMeta, Difficulty } from '@/src/lib/tools/registry'

type Props = { tools: ToolMeta[] }

type ToolCategory = 'All' | 'Hooks' | 'Content' | 'DMs' | 'Offers' | 'Analytics' | 'Audience' | 'Competitive'

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

const CATEGORIES: ToolCategory[] = [
  'All',
  'Hooks',
  'Content',
  'DMs',
  'Offers',
  'Analytics',
  'Audience',
  'Competitive',
]

const PREFLIGHT_TTL_KEY = 'tools_preflight_ttl_ts'
const PREFLIGHT_TTL_MS = 75_000
const canUseSessionStorage = () =>
  typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined'

function normalizeText(s: string) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqSorted(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b))
}

function difficultyRank(d: Difficulty) {
  if (d === 'easy') return 0
  if (d === 'medium') return 1
  return 2
}

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

type WorstLockBanner =
  | { kind: 'tokens'; remainingTokens?: number; requiredTokens?: number }
  | { kind: 'plan' }
  | { kind: 'resets'; resetsAtISO?: string }
  | { kind: 'role' }

function getWorstLockBanner(preflightMap: Record<string, ToolPreflightResult>): WorstLockBanner | null {
  const locked = Object.values(preflightMap).filter((r) => r.status === 'locked')
  if (!locked.length) return null

  const tokensLock = locked.find((r) => r.lockCode === 'locked_tokens')
  if (tokensLock) {
    return {
      kind: 'tokens',
      remainingTokens: tokensLock.remainingTokens,
      requiredTokens: tokensLock.requiredTokens,
    }
  }

  const planLock = locked.find((r) => r.lockCode === 'locked_plan')
  if (planLock) return { kind: 'plan' }

  const resetLocks = locked.filter(
    (r) => r.lockCode === 'locked_usage_daily' || r.lockCode === 'locked_tool_daily'
  )
  if (resetLocks.length) {
    const resetTimes = resetLocks
      .map((r) => r.usage?.resetsAtISO)
      .filter(Boolean)
      .map((iso) => new Date(iso as string).getTime())

    const worstReset =
      resetTimes.length > 0 ? new Date(Math.max(...resetTimes)).toISOString() : resetLocks[0].usage?.resetsAtISO

    return { kind: 'resets', resetsAtISO: worstReset }
  }

  const roleLock = locked.find((r) => r.lockCode === 'locked_role')
  if (roleLock) return { kind: 'role' }

  return null
}

export default function ExploreTools({ tools }: Props) {
  const [category, setCategory] = React.useState<ToolCategory>('All')
  const [difficulty, setDifficulty] = React.useState<Difficulty | 'all'>('all')
  const [query, setQuery] = React.useState('')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])
  const [availableOnly, setAvailableOnly] = React.useState(false)

  const [preflightMap, setPreflightMap] = React.useState<Record<string, ToolPreflightResult>>({})
  const [preflightReqId, setPreflightReqId] = React.useState<string | null>(null)
  const [preflightLoading, setPreflightLoading] = React.useState(false)
  const [preflightError, setPreflightError] = React.useState<string | null>(null)

  const toolsWithCategory = React.useMemo(() => {
    return tools.map((t) => ({
      ...t,
      __category: t.category || deriveCategoryFromTags(t.tags ?? []),
    }))
  }, [tools])

  const allTags = React.useMemo(() => {
    const tags = tools.flatMap((t) => t.tags ?? [])
    return uniqSorted(tags.map((t) => String(t).trim()).filter(Boolean))
  }, [tools])

  const categoryCounts = React.useMemo(() => {
    const counts: Record<ToolCategory, number> = {
      All: toolsWithCategory.length,
      Hooks: 0,
      Content: 0,
      DMs: 0,
      Offers: 0,
      Analytics: 0,
      Audience: 0,
      Competitive: 0,
    }

    for (const tool of toolsWithCategory) {
      counts[tool.__category] += 1
    }

    return counts
  }, [toolsWithCategory])

  const statusCounts = React.useMemo(() => {
    const values = Object.values(preflightMap)
    if (!values.length) return { available: 0, locked: 0 }
    return values.reduce(
      (acc, item) => {
        if (item.status === 'ok') acc.available += 1
        if (item.status === 'locked') acc.locked += 1
        return acc
      },
      { available: 0, locked: 0 }
    )
  }, [preflightMap])

  const runPreflight = React.useCallback(
    async ({ force = false }: { force?: boolean } = {}) => {
      if (!tools.length) return

      if (!force && canUseSessionStorage()) {
        const last = Number(window.sessionStorage.getItem(PREFLIGHT_TTL_KEY) ?? 0)
        if (last && Date.now() - last < PREFLIGHT_TTL_MS) return
      }

      setPreflightLoading(true)
      setPreflightError(null)

      try {
        const res = await fetch('/api/tools/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolIds: tools.map((t) => t.id) }),
        })

        const rid = res.headers.get('x-request-id')
        setPreflightReqId(rid)

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
        setPreflightReqId(null)
        setPreflightError(err instanceof Error ? err.message : 'Preflight failed.')
      } finally {
        setPreflightLoading(false)
      }
    },
    [tools]
  )

  React.useEffect(() => {
    void runPreflight()
  }, [runPreflight])

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

  const worstLockBanner = React.useMemo(
    () => (preflightError ? null : getWorstLockBanner(preflightMap)),
    [preflightError, preflightMap]
  )

  const filtered = React.useMemo(() => {
    const q = normalizeText(query)

    return toolsWithCategory
      .filter((t) => {
        if (category !== 'All' && t.__category !== category) return false
        if (difficulty !== 'all' && t.difficulty !== difficulty) return false
        if (availableOnly && preflightMap[t.id]?.status === 'locked') return false

        if (selectedTags.length) {
          const set = new Set((t.tags ?? []).map((x) => String(x)))
          for (const tag of selectedTags) if (!set.has(tag)) return false
        }

        if (q) {
          const hay = normalizeText(`${t.name} ${t.description} ${(t.tags ?? []).join(' ')} ${t.__category} ${t.id}`)
          if (!hay.includes(q)) return false
        }

        return true
      })
      .sort((a, b) => {
        const ar = difficultyRank(a.difficulty)
        const br = difficultyRank(b.difficulty)
        if (ar !== br) return ar - br
        return a.name.localeCompare(b.name)
      })
  }, [toolsWithCategory, category, difficulty, query, selectedTags, availableOnly, preflightMap])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function clearFilters() {
    setCategory('All')
    setDifficulty('all')
    setQuery('')
    setSelectedTags([])
    setAvailableOnly(false)
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-[0.3em] text-neutral-500">Explore</div>
            <h1 className="text-2xl font-semibold text-neutral-100 md:text-3xl">Find the right tool fast</h1>
            <p className="text-sm text-neutral-400">
              Filter by category, difficulty, and tags. Availability updates are live and plan-aware.
            </p>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-[420px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, tags, or outcomes..."
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500"
            />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => runPreflight({ force: true })}
                className="rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200 hover:bg-neutral-800"
              >
                Refresh availability
              </button>
              <label className="flex items-center gap-2 rounded-md border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-xs text-neutral-200">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="accent-red-500"
                />
                Available only
              </label>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
            <div className="text-xs text-neutral-500">Tools in catalog</div>
            <div className="text-lg font-semibold text-neutral-100">{toolsWithCategory.length}</div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
            <div className="text-xs text-neutral-500">Available now</div>
            <div className="text-lg font-semibold text-emerald-200">
              {statusCounts.available || (preflightLoading ? '...' : 0)}
            </div>
          </div>
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
            <div className="text-xs text-neutral-500">Locked right now</div>
            <div className="text-lg font-semibold text-yellow-200">
              {statusCounts.locked || (preflightLoading ? '...' : 0)}
            </div>
          </div>
        </div>
      </section>

      {preflightError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-100">
          <div>Could not check availability. {preflightError}</div>
          <button
            type="button"
            onClick={() => runPreflight({ force: true })}
            className="rounded-md border border-red-500/60 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
          >
            Retry
          </button>
        </div>
      ) : null}

      {worstLockBanner ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-3 text-sm text-neutral-200">
          {worstLockBanner.kind === 'tokens' ? (
            <>
              <div>
                You&apos;re locked by tokens{' '}
                <span className="text-neutral-400">
                  ({worstLockBanner.remainingTokens ?? 0}/{worstLockBanner.requiredTokens ?? '—'} tokens)
                </span>{' '}
                -> Buy tokens
              </div>
              <a
                href="/pricing"
                className="rounded-md border border-red-500/60 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
              >
                Buy tokens
              </a>
            </>
          ) : worstLockBanner.kind === 'plan' ? (
            <>
              <div>Locked by plan -> Upgrade</div>
              <a
                href="/pricing"
                className="rounded-md border border-red-500/60 bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500"
              >
                Upgrade
              </a>
            </>
          ) : worstLockBanner.kind === 'role' ? (
            <div>Viewer seats cannot run tools. Ask an admin to upgrade your role.</div>
          ) : (
            <div>
              Resets at{' '}
              <span className="font-semibold">
                {worstLockBanner.resetsAtISO ? new Date(worstLockBanner.resetsAtISO).toLocaleString() : 'soon'}
              </span>{' '}
              -> Come back then
            </div>
          )}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Filters</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 text-xs text-neutral-500">Difficulty</div>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
                >
                  <option value="all">All</option>
                  <option value="easy">Beginner</option>
                  <option value="medium">Intermediate</option>
                  <option value="hard">Advanced</option>
                </select>
              </div>

              <button
                type="button"
                onClick={clearFilters}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-800"
              >
                Reset filters
              </button>
            </div>
          </div>

          {allTags.length ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">Tags</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {allTags.map((t) => {
                  const active = selectedTags.includes(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className={[
                        'rounded-full px-3 py-1 text-xs',
                        active
                          ? 'bg-neutral-100 text-neutral-900'
                          : 'border border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-900',
                      ].join(' ')}
                    >
                      #{t}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}
        </aside>

        <main className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = c === category
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={[
                    'rounded-full px-3 py-1.5 text-sm',
                    active
                      ? 'bg-red-600 text-white'
                      : 'border border-neutral-800 bg-neutral-950 text-neutral-200 hover:bg-neutral-900',
                  ].join(' ')}
                >
                  {c}
                  <span className="ml-2 text-xs text-neutral-300">{categoryCounts[c] ?? 0}</span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-3">
            <div className="text-sm text-neutral-400">
              Showing <span className="font-semibold text-neutral-100">{filtered.length}</span> tools
            </div>
            <div className="flex items-center gap-2 text-[11px] text-neutral-400">
              <span className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-0.5">Plan</span>
              <span className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-0.5">Tokens</span>
              <span className="rounded-md border border-neutral-700 bg-neutral-950 px-2 py-0.5">Cap</span>
              <span className="text-neutral-500">
                {preflightLoading ? 'Checking...' : 'Updated'}
                {preflightReqId ? ` • req: ${preflightReqId}` : ''}
              </span>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-300">
              Nothing matches those filters. Try clearing tags or searching less aggressively.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((t) => (
                <ToolCard key={t.id} tool={t} category={t.__category} preflight={preflightMap[t.id]} />
              ))}
            </div>
          )}
        </main>
      </div>
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
  const href = `/app/tools/${tool.id}`

  const badge = badgeForPreflight(preflight)
  const badgeClass =
    badge.tone === 'good'
      ? 'bg-emerald-950/30 border-emerald-900 text-emerald-200'
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
        <div className="text-sm font-semibold text-red-300 group-hover:text-red-200">Open tool -></div>
        {preflight?.status === 'locked' && preflight.message ? (
          <div className="max-w-[55%] truncate text-xs text-neutral-500" title={preflight.message}>
            {preflight.message}
          </div>
        ) : null}
      </div>
    </a>
  )
}
