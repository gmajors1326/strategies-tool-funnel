'use client'

import * as React from 'react'
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

const TAG_CATEGORY_RULES: Record<string, Exclude<ToolCategory, 'All'>> = {
  hook: 'Hooks',
  hooks: 'Hooks',
  opener: 'Hooks',

  caption: 'Content',
  captions: 'Content',
  reel: 'Content',
  reels: 'Content',
  script: 'Content',
  scripts: 'Content',
  carousel: 'Content',
  story: 'Content',
  stories: 'Content',
  hashtag: 'Content',
  hashtags: 'Content',
  repurpose: 'Content',
  content: 'Content',

  dm: 'DMs',
  dms: 'DMs',
  outreach: 'DMs',
  conversation: 'DMs',
  sales: 'DMs',

  offer: 'Offers',
  offers: 'Offers',
  cta: 'Offers',
  conversion: 'Offers',
  pricing: 'Offers',
  positioning: 'Offers',

  retention: 'Analytics',
  engagement: 'Analytics',
  performance: 'Analytics',
  analytics: 'Analytics',
  diagnostic: 'Analytics',

  audience: 'Audience',
  niche: 'Audience',
  persona: 'Audience',
  copy: 'Audience',

  competitor: 'Competitive',
  competitors: 'Competitive',
  angle: 'Competitive',
  angles: 'Competitive',
  strategy: 'Competitive',
}

function deriveCategoryFromTags(tags: string[] | undefined): Exclude<ToolCategory, 'All'> {
  const safe = (tags ?? [])
    .map((t) => String(t).trim().toLowerCase())
    .filter(Boolean)
  for (const t of safe) {
    const hit = TAG_CATEGORY_RULES[t]
    if (hit) return hit
  }
  return 'Content'
}

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
  if (!p) return { label: 'Checking…', tone: 'neutral' as const }
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
  const [category, setCategory] = React.useState<ToolCategory>('All')
  const [difficulty, setDifficulty] = React.useState<Difficulty | 'all'>('all')
  const [query, setQuery] = React.useState('')
  const [selectedTags, setSelectedTags] = React.useState<string[]>([])

  const [preflightMap, setPreflightMap] = React.useState<Record<string, ToolPreflightResult>>({})
  const [preflightReqId, setPreflightReqId] = React.useState<string | null>(null)
  const [preflightLoading, setPreflightLoading] = React.useState(false)

  const toolsWithCategory = React.useMemo(() => {
    return tools.map((t) => ({
      ...t,
      __category: (t as any).category || deriveCategoryFromTags(t.tags),
    }))
  }, [tools])

  const allTags = React.useMemo(() => {
    const tags = tools.flatMap((t) => t.tags ?? [])
    return uniqSorted(tags.map((t) => String(t).trim()).filter(Boolean))
  }, [tools])

  React.useEffect(() => {
    let cancelled = false

    async function runPreflight() {
      setPreflightLoading(true)
      try {
        const res = await fetch('/api/tools/preflight', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toolIds: tools.map((t) => t.id) }),
        })

        const rid = res.headers.get('x-request-id')
        if (!cancelled) setPreflightReqId(rid)

        const json = await res.json()
        const results: ToolPreflightResult[] = json?.results ?? []

        const map: Record<string, ToolPreflightResult> = {}
        for (const r of results) map[r.toolId] = r

        if (!cancelled) setPreflightMap(map)
      } catch {
        if (!cancelled) {
          setPreflightMap({})
          setPreflightReqId(null)
        }
      } finally {
        if (!cancelled) setPreflightLoading(false)
      }
    }

    if (tools.length) void runPreflight()

    return () => {
      cancelled = true
    }
  }, [tools])

  const filtered = React.useMemo(() => {
    const q = normalizeText(query)

    return toolsWithCategory
      .filter((t) => {
        if (category !== 'All' && t.__category !== category) return false
        if (difficulty !== 'all' && t.difficulty !== difficulty) return false

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
  }, [toolsWithCategory, category, difficulty, query, selectedTags])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  function clearFilters() {
    setCategory('All')
    setDifficulty('all')
    setQuery('')
    setSelectedTags([])
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <div className="text-sm font-semibold text-neutral-200">Filters</div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100"
              >
                <option value="all">All difficulty</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools…"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 md:w-80"
            />

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-200 hover:bg-neutral-900"
              title="Refresh preflight"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
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
              </button>
            )
          })}
        </div>

        {allTags.length ? (
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium text-neutral-400">Tags</div>
            <div className="flex flex-wrap gap-2">
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

        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 p-3 text-xs text-neutral-300">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-semibold">Availability</span>{' '}
              <span className="text-neutral-500">
                {preflightLoading ? 'Checking…' : 'Updated'}
                {preflightReqId ? ` • req: ${preflightReqId}` : ''}
              </span>
            </div>
            <div className="text-neutral-500">Badges reflect plan + caps + token balance.</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-neutral-400">
          Showing <span className="font-semibold text-neutral-200">{filtered.length}</span> tools
        </div>
        <div className="text-xs text-neutral-500">Click a tool to run it. Runner preflight still applies.</div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-8 text-center text-neutral-300">
          Nothing matches those filters. Try clearing tags or searching less aggressively.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
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
      ? `${preflight.remainingTokens ?? 0}/${preflight.requiredTokens ?? tool.tokensPerRun} tok`
      : preflight?.status === 'locked' && preflight.usage?.resetsAtISO
        ? `Resets: ${new Date(preflight.usage.resetsAtISO).toLocaleString()}`
        : preflight?.status === 'ok'
          ? `${preflight.remainingTokens ?? '—'} tok left`
          : ''

  return (
    <a
      href={href}
      className="group rounded-xl border border-neutral-800 bg-neutral-950 p-4 hover:border-neutral-700 hover:bg-neutral-900/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-base font-semibold text-neutral-100 group-hover:text-white">{tool.name}</div>
          <div className="mt-1 line-clamp-2 text-sm text-neutral-400">{tool.description}</div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className={`rounded-md border px-2 py-1 text-xs ${badgeClass}`}>{badge.label}</span>
          <span className="rounded-md bg-neutral-900 px-2 py-1 text-xs text-neutral-400">{tool.tokensPerRun} tok</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
        <span className="rounded-md bg-neutral-900 px-2 py-1">{category}</span>
        <span className="rounded-md bg-neutral-900 px-2 py-1">id: {tool.id}</span>
        {sub ? <span className="rounded-md bg-neutral-900 px-2 py-1">{sub}</span> : null}
      </div>

      {tool.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {tool.tags.slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-neutral-800 bg-neutral-950 px-2 py-1 text-xs text-neutral-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm font-semibold text-red-300 group-hover:text-red-200">Open tool →</div>
        {preflight?.status === 'locked' && preflight.message ? (
          <div className="max-w-[55%] truncate text-xs text-neutral-500" title={preflight.message}>
            {preflight.message}
          </div>
        ) : null}
      </div>
    </a>
  )
}
