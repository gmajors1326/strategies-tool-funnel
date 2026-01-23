'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

type Props = {
  toolId: string
  toolSlug: string
  runId: string | null
  canExport: boolean
  canSaveToVault: boolean
  canExportTemplates: boolean
  onMessage: (msg: string | null) => void
}

type ExportKind = 'json' | 'csv' | 'template'

export function ToolRunToolbar({
  toolId,
  toolSlug,
  runId,
  canExport,
  canSaveToVault,
  canExportTemplates,
  onMessage,
}: Props) {
  const router = useRouter()
  const [exportKind, setExportKind] = React.useState<ExportKind>('json')
  const [busy, setBusy] = React.useState<string | null>(null)

  const missingRun = !runId
  const planLocked = {
    export: !canExport,
    save: !canSaveToVault,
    template: !canExportTemplates,
    pdf: !canExport,
  }

  const routeToPricing = (feature?: 'save' | 'export' | 'pdf') => {
    const featureParam = feature ? `&feature=${feature}` : ''
    router.push(`/pricing?reason=plan&tab=plans${featureParam}`)
  }

  async function logEvent(eventName: string, meta: Record<string, any>) {
    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, meta }),
      })
    } catch {
      // ignore
    }
  }

  async function downloadFromUrl(url: string, filename: string) {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data?.error || 'Export failed.')
    }
    const blob = await res.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  }

  async function handleSave() {
    if (missingRun) return
    if (planLocked.save) return routeToPricing('save')
    setBusy('save')
    onMessage(null)
    try {
      const res = await fetch('/api/vault/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, runId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Save failed.')
      onMessage('Saved to Vault.')
    } catch (err: any) {
      onMessage(err?.message || 'Save failed.')
    } finally {
      setBusy(null)
    }
  }

  async function handleExport() {
    if (missingRun) return
    if ((exportKind === 'template' && planLocked.template) || (exportKind !== 'template' && planLocked.export)) {
      return routeToPricing('export')
    }
    setBusy('export')
    onMessage(null)
    try {
      await logEvent('export_started', { type: exportKind, toolId, runId })
      if (exportKind === 'json') {
        await downloadFromUrl(`/api/export/json?runId=${runId}`, `${toolSlug}-${runId}.json`)
      } else if (exportKind === 'csv') {
        await downloadFromUrl(`/api/export/csv?runId=${runId}`, `${toolSlug}-${runId}.csv`)
      } else {
        await downloadFromUrl(
          `/api/export/template?runId=${runId}&kind=template`,
          `${toolSlug}-${runId}-template.json`
        )
      }
      await logEvent('export_completed', { type: exportKind, toolId, runId })
      onMessage(`Exported ${exportKind}.`)
    } catch (err: any) {
      onMessage(err?.message || 'Export failed.')
    } finally {
      setBusy(null)
    }
  }

  async function handleExportPdf() {
    if (missingRun) return
    if (planLocked.pdf) return routeToPricing('pdf')
    setBusy('pdf')
    onMessage(null)
    try {
      await logEvent('export_started', { type: 'pdf', toolId, runId })
      await downloadFromUrl(`/api/export/pdf?runId=${runId}`, `${toolSlug}-${runId}.pdf`)
      await logEvent('export_completed', { type: 'pdf', toolId, runId })
      onMessage('Exported PDF.')
    } catch (err: any) {
      onMessage(err?.message || 'Export failed.')
    } finally {
      setBusy(null)
    }
  }

  function handlePrint() {
    if (missingRun) return
    void logEvent('print_opened', { toolId, runId })
    const url = `/tools/${toolSlug}/print?runId=${runId}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const disabledHint = missingRun ? 'Run the tool to enable export.' : undefined

  const exportLocked = exportKind === 'template' ? planLocked.template : planLocked.export

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleSave}
        aria-disabled={missingRun || planLocked.save}
        disabled={busy === 'save' || missingRun}
        className={planLocked.save && !missingRun ? 'opacity-60' : undefined}
        title={missingRun ? disabledHint : planLocked.save ? 'Available on Pro' : 'Save this run'}
      >
        Save to Vault
      </Button>

      <div className="flex items-center gap-2">
        <Select
          className="h-8 text-xs"
          value={exportKind}
          onChange={(e) => setExportKind(e.target.value as ExportKind)}
          disabled={missingRun}
          title={missingRun ? disabledHint : 'Choose export type'}
        >
          <option value="json">JSON</option>
          <option value="csv">CSV</option>
          <option value="template">Template</option>
        </Select>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleExport}
          aria-disabled={missingRun || exportLocked}
          disabled={busy === 'export' || missingRun}
          className={exportLocked && !missingRun ? 'opacity-60' : undefined}
          title={missingRun ? disabledHint : exportLocked ? 'Available on Pro' : 'Export output'}
        >
          Export
        </Button>
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={handleExportPdf}
        aria-disabled={missingRun || planLocked.pdf}
        disabled={busy === 'pdf' || missingRun}
        className={planLocked.pdf && !missingRun ? 'opacity-60' : undefined}
        title={missingRun ? disabledHint : planLocked.pdf ? 'Available on Pro' : 'Export PDF'}
      >
        Export PDF
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={handlePrint}
        disabled={missingRun}
        title={missingRun ? disabledHint : 'Print'}
      >
        Print
      </Button>
    </div>
  )
}
