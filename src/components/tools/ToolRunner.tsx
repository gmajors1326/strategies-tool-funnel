'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

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
  output: any
  meta?: {
    tokensUsed?: number
    model?: string
    latencyMs?: number
  }
  entitlements?: any
  error?: string
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
  fields: ToolField[]
  access?: 'unlocked' | 'locked_tokens' | 'locked_time' | 'locked_plan'
  tokensCost?: number
  ui?: UiConfig | null
}) {
  const { toolId, toolSlug, toolName, fields, access, tokensCost, ui } = props

  const [input, setInput] = React.useState<Record<string, any>>({})
  const [busy, setBusy] = React.useState(false)
  const [result, setResult] = React.useState<RunResponse | null>(null)
  const [history, setHistory] = React.useState<any[]>([])
  const [copied, setCopied] = React.useState<string | null>(null)
  const [msg, setMsg] = React.useState<string | null>(null)

  const canExport = Boolean(ui?.entitlements?.canExport)
  const canSeeHistory = Boolean(ui?.entitlements?.canSeeHistory)
  const canSaveToVault = Boolean(ui?.entitlements?.canSaveToVault)
  const canExportTemplates = Boolean(ui?.entitlements?.canExportTemplates)

  const isLocked = access === 'locked_tokens' || access === 'locked_time' || access === 'locked_plan'

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

    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, toolSlug, input }),
      })

      const data = (await res.json()) as RunResponse

      if (!res.ok) {
        setResult({ error: data?.error || 'Run failed.' })
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

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="text-base">Run {toolName}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
              title={canExport ? 'Download output' : 'Export is a paid perk'}
            >
              Export
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canSaveToVault}
              onClick={saveToVault}
              title={canSaveToVault ? 'Save this run' : 'Vault is a paid perk'}
            >
              Save to Vault
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canExportTemplates}
              onClick={() => exportTemplate('template')}
              title={canExportTemplates ? 'Export template' : 'Templates are a paid perk'}
            >
              Template
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={!result?.output || !canExportTemplates}
              onClick={() => exportTemplate('checklist')}
              title={canExportTemplates ? 'Export checklist' : 'Checklists are a paid perk'}
            >
              Checklist
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {!canExport ? (
            <div className="rounded-md border p-3 text-xs text-muted-foreground">
              Export is locked (paid perk). Copy JSON is still available.
            </div>
          ) : null}

          {result?.error ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">{result.error}</div>
          ) : result?.output ? (
            <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
              {typeof result.output === 'string' ? result.output : JSON.stringify(result.output, null, 2)}
            </pre>
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
