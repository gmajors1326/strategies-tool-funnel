'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ToolSearchProps {
  onSearchChange: (query: string) => void
  searchQuery: string
}

export function ToolSearch({ onSearchChange, searchQuery }: ToolSearchProps) {
  const handleClear = () => {
    onSearchChange('')
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted))] w-4 h-4 sm:w-5 sm:h-5" />
      <Input
        type="text"
        placeholder="Search tools by name or description..."
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
