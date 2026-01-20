'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/src/components/ui/Button'

type ToolFeedbackPanelProps = {
  toolId: string
  eligible: boolean
  onGranted: (remaining: number) => void
}

export function ToolFeedbackPanel({ toolId, eligible, onGranted }: ToolFeedbackPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState<number | undefined>()
  const [goal, setGoal] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<string | null>(null)

  const isValid = useMemo(() => message.trim().length >= 120, [message])

  const handleSubmit = async () => {
    setStatus('submitting')
    const res = await fetch('/api/tools/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.NODE_ENV === 'development' ? { 'x-user-id': 'user_dev_1' } : {}),
      },
      body: JSON.stringify({ toolId, rating, goal, message }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('submitted')
      onGranted(data.bonusRunsRemaining ?? 0)
    } else {
      setStatus(data.error?.message || 'error')
    }
  }

  if (!eligible) {
    return null
  }

  return (
    <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-4 space-y-2">
      <p className="text-sm font-semibold">Want a few more sandbox runs?</p>
      <p className="text-xs text-[hsl(var(--muted))]">
        Help us improve this tool. Tell us what worked and what didn&apos;t.
      </p>
      <p className="text-xs text-[hsl(var(--muted))]">
        You can unlock up to 3 bonus sandbox runs for this tool.
      </p>
      <Button onClick={() => setIsOpen(true)}>Leave feedback</Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-2))] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Help improve this tool</p>
              <button
                onClick={() => setIsOpen(false)}
                className="text-xs text-[hsl(var(--muted))]"
              >
                Close
              </button>
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[hsl(var(--muted))]">Rating (optional)</label>
              <input
                type="number"
                min={1}
                max={5}
                value={rating ?? ''}
                onChange={(e) => setRating(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[hsl(var(--muted))]">
                What were you trying to accomplish? (optional)
              </label>
              <input
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs text-[hsl(var(--muted))]">
                What worked / what didn&apos;t? (required, min 120 chars)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="h-28 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-3 py-2 text-sm"
              />
            </div>
            <Button onClick={handleSubmit} disabled={!isValid || status === 'submitting'} className="w-full">
              Submit feedback &amp; unlock bonus runs
            </Button>
            <p className="text-xs text-[hsl(var(--muted))]">
              {status === 'submitted' ? 'Thanks! Bonus runs unlocked.' : 'Feedback is reviewed for quality.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
