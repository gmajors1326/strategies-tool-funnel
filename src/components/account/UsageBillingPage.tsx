'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/src/components/ui/Button'
import { Card } from '@/src/components/ui/Card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { TOOL_REGISTRY } from '@/src/lib/tools/registry'
import { isLaunchTool } from '@/src/lib/tools/launchTools'

type UsageSummary = {
  user: { planId: 'free' | 'pro_monthly' | 'team' | 'lifetime' }
  tokens: {
    balance: number
    planDailyAllowance: number
    nextResetAt: string | null
    spentToday?: number
  }
  actions: {
    pricingUrl: string
    buyTokensUrl: string
    managePlanUrl: string
  }
}

type LedgerItem = {
  id: string
  createdAt: string
  delta: number
  reason: string
  sku?: string
  stripePaymentIntentId?: string
  note?: string
}

type ToolRunItem = {
  id: string
  toolId: string
  toolName?: string
  status: 'success' | 'failed' | 'locked'
  tokensCharged: number
  inputSummary?: string
  createdAt: string
  errorCode?: string
}

const TOOL_OPTIONS = [{ id: 'all', name: 'All tools' }].concat(
  Object.values(TOOL_REGISTRY)
    .filter((tool) => isLaunchTool(tool.id))
    .map((tool) => ({ id: tool.id, name: tool.name }))
)

export function UsageBillingPage() {
  const [summary, setSummary] = React.useState<UsageSummary | null>(null)
  const [ledger, setLedger] = React.useState<LedgerItem[]>([])
  const [ledgerCursor, setLedgerCursor] = React.useState<string | null>(null)
  const [ledgerLoading, setLedgerLoading] = React.useState(false)

  const [runs, setRuns] = React.useState<ToolRunItem[]>([])
  const [runsCursor, setRunsCursor] = React.useState<string | null>(null)
  const [runsLoading, setRunsLoading] = React.useState(false)
  const [toolFilter, setToolFilter] = React.useState('all')
  const [statusFilter, setStatusFilter] = React.useState('all')

  React.useEffect(() => {
    let active = true
    async function loadSummary() {
      const res = await fetch('/api/me/usage', { cache: 'no-store' })
      if (!res.ok) return
      const json = (await res.json()) as UsageSummary
      if (active) setSummary(json)
    }
    loadSummary()
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'usage_viewed' }),
    })
    return () => {
      active = false
    }
  }, [])

  const loadLedger = React.useCallback(
    async (cursor?: string | null) => {
      setLedgerLoading(true)
      const params = new URLSearchParams({ limit: '25' })
      if (cursor) params.set('cursor', cursor)
      const res = await fetch(`/api/me/token-ledger?${params.toString()}`)
      const json = await res.json()
      setLedger((prev) => (cursor ? prev.concat(json.items || []) : json.items || []))
      setLedgerCursor(json.nextCursor || null)
      setLedgerLoading(false)
    },
    []
  )

  const loadRuns = React.useCallback(
    async (cursor?: string | null) => {
      setRunsLoading(true)
      const params = new URLSearchParams({ limit: '25' })
      if (cursor) params.set('cursor', cursor)
      if (toolFilter && toolFilter !== 'all') params.set('toolId', toolFilter)
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`/api/me/tool-runs?${params.toString()}`)
      const json = await res.json()
      setRuns((prev) => (cursor ? prev.concat(json.items || []) : json.items || []))
      setRunsCursor(json.nextCursor || null)
      setRunsLoading(false)
    },
    [toolFilter, statusFilter]
  )

  React.useEffect(() => {
    loadLedger()
  }, [loadLedger])

  React.useEffect(() => {
    loadRuns()
  }, [loadRuns, toolFilter, statusFilter])

  const planLabel = summary?.user?.planId ? summary.user.planId.replace('_', ' ') : 'free'
  const resetAt = summary?.tokens?.nextResetAt

  async function handleManagePlan() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data?.url) window.location.href = data.url
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Usage</h1>
        <p className="text-sm text-[hsl(var(--muted))]">Token balance, runs, and billing history.</p>
      </div>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[hsl(var(--muted))]">You&apos;re on {planLabel}</p>
            <p className="text-3xl font-semibold">
              {summary?.tokens?.balance?.toLocaleString() ?? '—'} tokens
            </p>
            <p className="text-xs text-[hsl(var(--muted))]">
              Resets at {resetAt ? new Date(resetAt).toLocaleString() : '—'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/pricing?tab=tokens&reason=tokens">
              <Button>Buy tokens</Button>
            </Link>
            <Button variant="outline" onClick={handleManagePlan}>
              Manage plan
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Token history</p>
        </div>
        {ledger.length ? (
          <div className="space-y-2 text-sm">
            {ledger.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-2">
                <div>
                  <div className="text-xs text-[hsl(var(--muted))]">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm capitalize">{item.reason}</div>
                  {item.note ? <div className="text-xs text-[hsl(var(--muted))]">{item.note}</div> : null}
                </div>
                <div className="text-sm font-semibold">{item.delta > 0 ? `+${item.delta}` : item.delta}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted))]">No token activity yet.</p>
        )}
        {ledgerCursor ? (
          <Button variant="outline" onClick={() => loadLedger(ledgerCursor)} disabled={ledgerLoading}>
            {ledgerLoading ? 'Loading...' : 'Load more'}
          </Button>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Tool runs</p>
          <div className="flex flex-wrap gap-2">
            <select
              value={toolFilter}
              onChange={(e) => setToolFilter(e.target.value)}
              className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-2 py-1 text-xs"
            >
              {TOOL_OPTIONS.map((tool) => (
                <option key={tool.id} value={tool.id}>
                  {tool.name}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] px-2 py-1 text-xs"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="locked">Locked</option>
            </select>
          </div>
        </div>

        {runs.length ? (
          <div className="space-y-2 text-sm">
            {runs.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[hsl(var(--border))] pb-2">
                <div>
                  <div className="text-xs text-[hsl(var(--muted))]">
                    {new Date(item.createdAt).toLocaleString()}
                  </div>
                  <div className="text-sm">{item.toolName || item.toolId}</div>
                  {item.inputSummary ? (
                    <div className="text-xs text-[hsl(var(--muted))]">{item.inputSummary}</div>
                  ) : null}
                  {item.errorCode ? (
                    <div className="text-xs text-[hsl(var(--muted))]">Error: {item.errorCode}</div>
                  ) : null}
                </div>
                <div className="text-xs text-[hsl(var(--muted))]">
                  {item.status} · {item.tokensCharged} tokens
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[hsl(var(--muted))]">No runs yet.</p>
        )}

        {runsCursor ? (
          <Button variant="outline" onClick={() => loadRuns(runsCursor)} disabled={runsLoading}>
            {runsLoading ? 'Loading...' : 'Load more'}
          </Button>
        ) : null}
      </Card>

      <Accordion type="single" collapsible>
        <AccordionItem value="limits">
          <AccordionTrigger>How limits work</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 text-sm text-[hsl(var(--muted))]">
              <p>Plans include a daily token reset.</p>
              <p>Some tools have cooldowns.</p>
              <p>Token packs stack on top of plan limits.</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  )
}
