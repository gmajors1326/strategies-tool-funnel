'use client'

import { useState } from 'react'
import { Button } from '@/src/components/ui/Button'

type ToolRunFormProps = {
  toolId: string
  mode: 'paid' | 'trial'
  trialMode?: string
  onRun: (input: Record<string, any>) => void
  loading?: boolean
  disabled?: boolean
  validationErrors?: Record<string, string>
}

const fieldMap: Record<string, { label: string; key: string }[]> = {
  'hook-analyzer': [
    { label: 'Hook', key: 'hook' },
    { label: 'Topic', key: 'topic' },
  ],
  'cta-match-analyzer': [
    { label: 'Offer', key: 'offer' },
    { label: 'CTA', key: 'cta' },
    { label: 'Audience', key: 'audience' },
  ],
  'ig-post-intelligence': [
    { label: 'Caption', key: 'caption' },
    { label: 'Post text', key: 'postText' },
  ],
  'yt-video-intelligence': [
    { label: 'Title', key: 'title' },
    { label: 'Description', key: 'description' },
    { label: 'Transcript snippet', key: 'transcriptSnippet' },
  ],
}

export function ToolRunForm({
  toolId,
  onRun,
  loading,
  disabled,
  validationErrors,
}: ToolRunFormProps) {
  const fields = fieldMap[toolId] ?? [{ label: 'Input', key: 'input' }]
  const [values, setValues] = useState<Record<string, string>>({})

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-3">
      <p className="text-xs uppercase text-[hsl(var(--muted))]">Inputs</p>
      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs text-[hsl(var(--muted))]">{field.label}</label>
            <input
              value={values[field.key] ?? ''}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
            />
            {validationErrors?.[field.key] && (
              <p className="text-xs text-red-300">{validationErrors[field.key]}</p>
            )}
          </div>
        ))}
      </div>
      <Button onClick={() => onRun(values)} disabled={loading || disabled}>
        {loading ? 'Running...' : 'Run'}
      </Button>
    </div>
  )
}
