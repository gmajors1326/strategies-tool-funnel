'use client'

export function useKeyboardShortcuts(options: {
  onRun?: () => void
  onClear?: () => void
  onFocusSearch?: () => void
  enabled?: boolean
}) {
  if (typeof window === 'undefined') return

  const { onRun, onClear, onFocusSearch, enabled = true } = options

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!enabled) return

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey

    // Ctrl/Cmd + Enter: Run analysis
    if (ctrlOrCmd && e.key === 'Enter' && onRun) {
      e.preventDefault()
      onRun()
      return
    }

    // Esc: Clear all
    if (e.key === 'Escape' && onClear) {
      e.preventDefault()
      onClear()
      return
    }

    // Ctrl/Cmd + K: Focus search
    if (ctrlOrCmd && e.key === 'k' && onFocusSearch) {
      e.preventDefault()
      onFocusSearch()
      return
    }
  }

  return handleKeyDown
}
