'use client'

import { useState } from 'react'
import { AppPanel } from '@/components/ui/AppPanel'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Clock, Star, X } from 'lucide-react'
import { RecentRun, getPinnedRunIds, isPinnedRun, togglePinnedRun } from '@/lib/recentRuns'
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
  const [searchQuery, setSearchQuery] = useState('')

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

  const handleTogglePinned = (e: React.MouseEvent, runId: string) => {
    e.stopPropagation()
    togglePinnedRun(runId)
    window.dispatchEvent(new Event('storage'))
  }

  const filteredRuns = (() => {
    if (!searchQuery.trim()) {
      return runs
    }
    const query = searchQuery.toLowerCase().trim()
    const toSearchText = (run: RecentRun): string =>
      [
        run.title,
        JSON.stringify(run.inputs),
        JSON.stringify(run.outputs),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
    const scoreRun = (run: RecentRun): number => {
      const tokens = query.split(/[^a-z0-9]+/i).filter(Boolean)
      if (tokens.length === 0) return 1
      const haystack = toSearchText(run)
      let score = 0
      tokens.forEach((token) => {
        if (haystack.includes(token)) score += 1
      })
      return score
    }
    return runs
      .map((run) => ({ run, score: scoreRun(run) }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.run)
  })()

  const pinnedSet = new Set(getPinnedRunIds())
  const sortedRuns = [...filteredRuns].sort((a, b) => {
    const aPinned = pinnedSet.has(a.id)
    const bPinned = pinnedSet.has(b.id)
    if (aPinned !== bPinned) return aPinned ? -1 : 1
    return b.timestamp - a.timestamp
  })

  if (runs.length === 0) {
    return null
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
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search runs (semantic)"
            className="w-full rounded border border-[hsl(var(--border))] bg-[hsl(var(--surface-3))] px-2 py-1 text-xs text-[hsl(var(--text))] placeholder:text-[hsl(var(--muted))]"
          />
          {sortedRuns.map((run) => (
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
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleTogglePinned(e, run.id)}
                  className="h-6 w-6 p-0 flex-shrink-0"
                  aria-label={isPinnedRun(run.id) ? 'Unpin run' : 'Pin run'}
                >
                  <Star className={`w-3 h-3 ${isPinnedRun(run.id) ? 'fill-yellow-400 text-yellow-400' : 'text-[hsl(var(--muted))]'}`} />
                </Button>
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
            </div>
          ))}
          {sortedRuns.length === 0 && (
            <div className="text-xs text-[hsl(var(--muted))]">No runs match that search.</div>
          )}
        </div>
      )}
    </AppPanel>
  )
}
