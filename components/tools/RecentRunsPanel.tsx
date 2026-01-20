'use client'

import { useState } from 'react'
import { AppPanel } from '@/components/ui/AppPanel'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Clock, X } from 'lucide-react'
import { RecentRun } from '@/lib/recentRuns'
import { formatDistanceToNow } from 'date-fns'

// Fallback for formatDistanceToNow if date-fns fails
function formatTimeAgo(timestamp: number): string {
  try {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  } catch {
    const seconds = Math.floor((Date.now() - timestamp) / 1000)
    if (seconds < 60) return `${seconds} seconds ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} minutes ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} hours ago`
    const days = Math.floor(hours / 24)
    return `${days} days ago`
  }
}
import { removeRecentRun } from '@/lib/recentRuns'

interface RecentRunsPanelProps {
  toolId: string
  runs: RecentRun[]
  onLoadRun: (run: RecentRun) => void
}

export function RecentRunsPanel({ runs, onLoadRun }: RecentRunsPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (runs.length === 0) {
    return null
  }

  const handleLoadRun = (run: RecentRun) => {
    onLoadRun(run)
    setIsExpanded(false)
  }

  const handleRemoveRun = (e: React.MouseEvent, runId: string) => {
    e.stopPropagation()
    removeRecentRun(runId)
    // Trigger re-render by calling parent's refresh if needed
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <AppPanel variant="subtle" className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-[hsl(var(--surface-3))] transition-colors rounded-lg"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[hsl(var(--muted))]" />
          <span className="text-xs sm:text-sm font-medium text-[hsl(var(--text))]">
            Recent Runs ({runs.length})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[hsl(var(--muted))]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[hsl(var(--muted))]" />
        )}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {runs.map((run) => (
            <div
              key={run.id}
              className="flex items-start justify-between gap-2 p-2 bg-[hsl(var(--surface-3))] rounded border border-[hsl(var(--border))] hover:border-[hsl(var(--primary))] transition-colors"
            >
              <button
                onClick={() => handleLoadRun(run)}
                className="flex-1 text-left min-w-0"
              >
                <div className="text-xs text-[hsl(var(--text))] font-medium truncate">
                  {run.title || `Run from ${formatTimeAgo(run.timestamp)}`}
                </div>
                <div className="text-xs text-[hsl(var(--muted))] mt-0.5">
                  {formatTimeAgo(run.timestamp)}
                </div>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleRemoveRun(e, run.id)}
                className="h-6 w-6 p-0 flex-shrink-0 hover:bg-[hsl(var(--destructive))] hover:text-[hsl(var(--destructive-foreground))]"
                aria-label="Remove run"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </AppPanel>
  )
}
