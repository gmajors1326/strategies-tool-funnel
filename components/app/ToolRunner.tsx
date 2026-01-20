'use client'

import { useState } from 'react'
import { Button } from '@/components/app/Button'
import { Input } from '@/components/app/Input'

type ToolRunnerProps = {
  toolId: string
}

export function ToolRunner({ toolId }: ToolRunnerProps) {
  const [status, setStatus] = useState<string | null>(null)

  const handleRun = async () => {
    setStatus('running')
    const res = await fetch('/api/tools/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolId, input: { note: 'placeholder' } }),
    })
    const data = await res.json()
    setStatus(res.ok ? `done:${data.runId}` : `error:${data.reason ?? data.error}`)
  }

  return (
    <div className="space-y-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4">
      <div>
        <p className="text-xs uppercase text-[hsl(var(--muted))]">Inputs</p>
        <Input placeholder="Schema-driven inputs will render here." />
      </div>
      <Button onClick={handleRun}>Run Tool</Button>
      <div className="rounded-md bg-[hsl(var(--surface-3))] p-3 text-xs text-[hsl(var(--muted))]">
        {status ? `Status: ${status}` : 'Results will appear here.'}
      </div>
    </div>
  )
}
