'use client'

import { useEffect, useMemo, useState } from 'react'
import type { AnalyticsResponse, DateRangePreset } from '@/lib/analytics/types'
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type LoadState = 'idle' | 'loading' | 'error' | 'success'

function classNames(...xs: (string | undefined | false)[]) {
  return xs.filter(Boolean).join(' ')
}

const presets: { id: DateRangePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7D' },
  { id: '14d', label: '14D' },
  { id: '30d', label: '30D' },
  { id: '90d', label: '90D' },
  { id: 'custom', label: 'Custom' },
]

export default function AnalyticsDashboard() {
  const [preset, setPreset] = useState<DateRangePreset>('7d')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')

  const [toolId, setToolId] = useState<string>('')
  const [plan, setPlan] = useState<string>('')
  const [country, setCountry] = useState<string>('')

  const [state, setState] = useState<LoadState>('idle')
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [error, setError] = useState<string>('')

  const qs = useMemo(() => {
    const params = new URLSearchParams()
    params.set('preset', preset)
    if (preset === 'custom') {
      if (from) params.set('from', from)
      if (to) params.set('to', to)
    }
    if (toolId) params.set('toolId', toolId)
    if (plan) params.set('plan', plan)
    if (country) params.set('country', country)
    return params.toString()
  }, [preset, from, to, toolId, plan, country])

  async function load() {
    try {
      setState('loading')
      setError('')
      const res = await fetch(`/api/admin/analytics?${qs}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(`Request failed (${res.status})`)
      const json = (await res.json()) as AnalyticsResponse
      setData(json)
      setState('success')
    } catch (err: any) {
      setState('error')
      setError(err?.message ?? 'Unknown error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs])

  const exportHrefJson = `/api/admin/analytics/export?${qs}&format=json`
  const exportHrefCsv = `/api/admin/analytics/export?${qs}&format=csv`

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={classNames(
                  'rounded-lg px-3 py-2 text-xs font-medium transition',
                  preset === p.id
                    ? 'bg-red-600 text-white'
                    : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={classNames('flex gap-2', preset !== 'custom' && 'opacity-40 pointer-events-none')}>
            <div>
              <div className="mb-1 text-xs text-zinc-400">From</div>
              <input
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                type="date"
                className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-400">To</div>
              <input
                value={to}
                onChange={(e) => setTo(e.target.value)}
                type="date"
                className="h-9 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div>
              <div className="mb-1 text-xs text-zinc-400">Tool</div>
              <input
                value={toolId}
                onChange={(e) => setToolId(e.target.value)}
                placeholder="e.g. hook-analyzer"
                className="h-9 w-48 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-400">Plan</div>
              <input
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="free / pro / team"
                className="h-9 w-36 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
            <div>
              <div className="mb-1 text-xs text-zinc-400">Country</div>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="US"
                className="h-9 w-24 rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <a
              href={exportHrefCsv}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              Export CSV
            </a>
            <a
              href={exportHrefJson}
              className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-800"
            >
              Export JSON
            </a>
            <button
              onClick={load}
              className="rounded-lg bg-red-600 px-3 py-2 text-xs font-medium text-white hover:bg-red-500"
            >
              Refresh
            </button>
          </div>
        </div>

        {state === 'loading' && (
          <div className="mt-3 text-xs text-zinc-500">Loading analytics…</div>
        )}
        {state === 'error' && (
          <div className="mt-3 text-xs text-red-300">Error: {error}</div>
        )}
        {state === 'success' && data && (
          <div className="mt-3 text-xs text-zinc-500">
            Range: {data.range.from} → {data.range.to} ({data.range.preset})
          </div>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {data.kpis.map((k) => (
            <div key={k.label} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
              <div className="text-xs text-zinc-500">{k.label}</div>
              <div className="mt-1 text-lg font-semibold text-zinc-100">{k.value.toLocaleString()}</div>
              <div
                className={classNames(
                  'mt-1 text-xs',
                  (k.deltaPct ?? 0) >= 0 ? 'text-emerald-300' : 'text-red-300'
                )}
              >
                {k.deltaPct != null ? `${k.deltaPct >= 0 ? '+' : ''}${k.deltaPct}%` : '—'}
              </div>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <ChartCard title="Sessions">
            <TimeSeriesChart data={data.timeseries.sessions} />
          </ChartCard>
          <ChartCard title="Tool Runs">
            <TimeSeriesChart data={data.timeseries.toolRuns} />
          </ChartCard>
          <ChartCard title="Signups">
            <TimeSeriesChart data={data.timeseries.signups} />
          </ChartCard>
          <ChartCard title="Revenue (USD)">
            <TimeSeriesChart data={data.timeseries.revenueUsd} />
          </ChartCard>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          <TableCard title="Funnel">
            <SimpleTable
              columns={[
                { key: 'step', label: 'Step' },
                { key: 'users', label: 'Users', right: true },
                { key: 'conversionPct', label: 'Conv %', right: true },
              ]}
              rows={data.funnel.map((f) => ({
                ...f,
                users: f.users.toLocaleString(),
                conversionPct: `${f.conversionPct}%`,
              }))}
            />
          </TableCard>

          <TableCard title="Tool Usage (Top)">
            <SimpleTable
              columns={[
                { key: 'toolId', label: 'Tool' },
                { key: 'runs', label: 'Runs', right: true },
                { key: 'uniqueUsers', label: 'Users', right: true },
                { key: 'successRatePct', label: 'Success', right: true },
              ]}
              rows={data.toolUsage.map((t) => ({
                toolId: t.toolId,
                runs: t.runs.toLocaleString(),
                uniqueUsers: t.uniqueUsers.toLocaleString(),
                successRatePct: `${t.successRatePct}%`,
              }))}
            />
          </TableCard>

          <TableCard title="AI Cost (Daily)">
            <SimpleTable
              columns={[
                { key: 'date', label: 'Date' },
                { key: 'costUsd', label: 'Cost', right: true },
                { key: 'calls', label: 'Calls', right: true },
              ]}
              rows={data.aiCosts
                .slice(-10)
                .reverse()
                .map((a) => ({
                  date: a.date,
                  costUsd: `$${a.costUsd.toFixed(2)}`,
                  calls: a.calls.toLocaleString(),
                }))}
            />
          </TableCard>
        </div>
      )}

      {data && (
        <TableCard title="Recent Errors">
          <SimpleTable
            columns={[
              { key: 'time', label: 'Time' },
              { key: 'route', label: 'Route' },
              { key: 'errorType', label: 'Type' },
              { key: 'message', label: 'Message' },
              { key: 'requestId', label: 'Req ID' },
              { key: 'userId', label: 'User' },
            ]}
            rows={data.recentErrors.map((e) => ({
              time: new Date(e.time).toLocaleString(),
              route: e.route,
              errorType: e.errorType,
              message: e.message,
              requestId: e.requestId ?? '',
              userId: e.userId ?? '',
            }))}
          />
        </TableCard>
      )}
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 text-sm font-medium text-zinc-200">{title}</div>
      <div className="h-56">{children}</div>
    </div>
  )
}

function TableCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-3 text-sm font-medium text-zinc-200">{title}</div>
      {children}
    </div>
  )
}

function TimeSeriesChart({ data }: { data: { date: string; value: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="4 4" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Line type="monotone" dataKey="value" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

function SimpleTable({
  columns,
  rows,
}: {
  columns: { key: string; label: string; right?: boolean }[]
  rows: Record<string, string>[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border-b border-zinc-800">
            {columns.map((c) => (
              <th
                key={c.key}
                className={classNames(
                  'px-2 py-2 text-left font-medium text-zinc-400',
                  c.right && 'text-right'
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={idx} className="border-b border-zinc-900 hover:bg-zinc-900/40">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={classNames(
                    'px-2 py-2 text-zinc-200',
                    c.right && 'text-right'
                  )}
                >
                  {r[c.key] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

