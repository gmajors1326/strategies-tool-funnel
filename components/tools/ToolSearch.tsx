'use client'

import { useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolSearchProps {
  onSearchChange: (query: string) => void
  searchQuery: string
  inputRef?: React.RefObject<HTMLInputElement>
}

export function ToolSearch({ onSearchChange, searchQuery, inputRef }: ToolSearchProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const ref = inputRef || internalRef
  
  const handleClear = () => {
    onSearchChange('')
    ref.current?.focus()
  }
  
  // Keyboard shortcut: Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey
      
      if (ctrlOrCmd && e.key === 'k') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [ref])

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted))] w-4 h-4 sm:w-5 sm:h-5" />
      <Input
        ref={ref}
        type="text"
        placeholder="Search tools by name or description... (Ctrl+K)"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 pr-10 text-sm sm:text-base bg-[hsl(var(--surface-2))] border-[hsl(var(--border))] text-[hsl(var(--text))] placeholder:text-[hsl(var(--muted))]"
      />
      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 sm:h-8 sm:w-8 p-0 hover:bg-[hsl(var(--surface-3))]"
          aria-label="Clear search"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4 text-[hsl(var(--muted))]" />
        </Button>
      )}
    </div>
  )
}
